'use strict';

var spawn = require('child-process-promise').spawn;
var quote = require('quote');
var Q = require('q');
var E = require('linq');
var SshClient = require('ssh-promise');
var fs = require('fs');
var assert = require('chai').assert;
var Mustache = require('Mustache');
var util = require('util');

var Azure = function (config) {

	assert.isObject(this);

	if (!config) {
		config = {};
	}
	else {
		assert.isObject(config);
	}

	var self = this;
	var verbose = config.verbose;

	//
	// Run an Azure command, return a promise.
	//
	self.runAzureCmd = function (args) {

		assert.isArray(args);
		assert(args.length > 0);

		var azureCmd = 'azure.cmd';

		var spawnOptions = {
			capture: [ 
				'stdout', 
				'stderr', 
			],
		};

		if (verbose) {
			console.log('Invoking command: "' + azureCmd + ' ' + args.map(function (arg) { return quote(arg); }).join(' ') + '"');
		}

		return spawn(azureCmd, args, spawnOptions) 
			.then(function (output) {
				if (verbose) {
					console.log(output.stdout);
					console.log(output.stderr);
				}
				return output;
			})
			.catch(function (err) {
				if (verbose) {
					console.log(err.stdout);
					console.log(err.stderr);
				}
				throw err;
			});
	};

	//
	// Create an Azure network.
	//
	self.createNetwork  = function (networkName, location) {

		assert.isString(networkName);
		assert.isString(location);

		if (verbose) {
			console.log('Creating network: ' + networkName);
		}

		var args = [
			'network',
			'vnet',
			'create',
			networkName,
			'-l',
			location,
		];

		return self.runAzureCmd(args);
	};

	//
	// Create an Azure VM in an existing network.
	//
	self.createVM  = function (vmName, networkName, imageName, user, pass, staticIP, endpoints) {
		
		assert.isString(vmName);
		assert.isString(networkName);
		assert.isString(imageName);
		assert.isString(user);
		assert.isString(pass);
		if (staticIP) {
			assert.isString(staticIP);
		}
		if (endpoints) {
			assert.isArray(endpoints);
		}

		if (verbose) {
			console.log('Creating vm ' + vmName + ' on network ' + networkName);
		}

		var args = [
			'vm',
			'create',
			vmName,
			imageName,
			user,
			pass,
			'--virtual-network-name',
			networkName,
			'--ssh',
		];

		if (staticIP) {
			args.push('--static-ip');
			args.push(staticIP);
		}

		return self.runAzureCmd(args)
			.then(function () {
				if (!endpoints) {
					return;
				}

				var endPointPromises = E.from(endpoints)
					.select(function (endpoint) {
						return self.createEndPoint(vmName, endpoint.externalPort, endpoint.internalPort, endpoint.name);
					})
					.toArray();

				return Q.all(endPointPromises);
			});
	};

	//
	// Create an endpoint on an existing Azure VM.
	//
	self.createEndPoint = function (vmName, externalPort, internalPort, endpointName) {

		assert.isString(vmName);
		assert.isNumber(externalPort);
		assert.isNumber(internalPort);
		assert.isString(endpointName);

		if (verbose) {
			console.log('Creating endpoint ' + endpointName + ' for ' + vmName);
		}

		var args = [
			'vm',
			'endpoint',
			'create',
			vmName,
			externalPort,
			internalPort,
			'--name="' + endpointName + '"',
		];

		return self.runAzureCmd(args);
	},

	//
	// Get the status of a particular Azure VM.
	//
	self.getVmStatus = function (vmName) {

		assert.isString(vmName);

		var args = [
			'vm',
			'show',
			vmName,
			'--json',
		];

		return self.runAzureCmd(args)
			.then(function (output) {
				return JSON.parse(output.stdout);
			});
	};

	//
	// Wait until a particular Azure VM is running.
	// Returns a promise that is resolved when the VM is running.
	//
	self.waitVmRunning = function (vmName) {

		assert.isString(vmName);

		if (verbose) {
			console.log(vmName + ': Waiting for VM to be running');
		}

		return Q.Promise(function (resolve, reject) {
			var checkVmRunning  = function () {
				self.getVmStatus(vmName)
					.then(function (status) {
						var isRunning = status.InstanceStatus === 'ReadyRole';
						if (isRunning) {
							if (verbose) {
								console.log(vmName + ': VM is running');
							}

							resolve();
						}
						else {
							if (verbose) {
								console.log(vmName + ': VM not yet running, current status: ' + status.InstanceStatus);
							}

							checkVmRunning();
						}
					})
					.catch(function (err) {
						if (verbose) {
							console.error(vmName + ': Error checking VM status.');
							console.error(err.stack);
						}

						checkVmRunning();
					});
			};

			checkVmRunning();
		});
	};

	//
	// Run a templated shell script on a particular Azure VM via ssh.
	//
	self.runSshScript = function (host, user, pass, scriptTemplate, templateView) {

		assert.isString(host);
		assert.isString(user);
		assert.isString(pass);
		assert.isString(scriptTemplate);
		if (templateView) {
			assert.isObject(templateView);
		}

		var sshConfig = {
			host: host,
			username: user,
			password: pass,
		};

		var scriptInstance = Mustache.render(scriptTemplate, templateView);

		var ssh = new SshClient(sshConfig);
		return ssh.spawn(azureCmd, scriptInstance);
	},

	//
	// Run a templated shell script on a particular Azure VM via ssh.
	//
	self.runSshScriptFile = function (host, user, pass, scriptFilePath, templateView) {

		assert.isString(host);
		assert.isString(user);
		assert.isString(pass);
		assert.isString(scriptFilePath);
		if (templateView) {
			assert.isObject(templateView);
		}

		if (verbose) {
			console.log('Running provisioning script ' + scriptFilePath + ' on VM ' + host);
		}

		var scriptTemplate = fs.readFileSync(scriptFilePath).toString();
		return self.runSshScript(host, user, pass, scriptTemplate, templateView);
	};

	//
	// Run a single or set of provisioning scripts on the VM.
	//
	self.runProvisioningScripts = function (host, user, pass, provisionScript, templateView) {

		assert.isString(host);
		assert.isString(user);
		assert.isString(pass);
		if (templateView) {
			assert.isObject(templateView);
		}

		if (util.isArray(provisionScript)) {
			return Q.all(E.from(provisionScript)
				.select(function (script) {
					return self.runSshScriptFile(host, user, pass, script, templateView)
				})
				.toArray()
			);
		}
		else {
			assert.isString(provisionScript);

			return self.runSshScriptFile(host, user, pass, provisionScript, templateView);
		}
	};

	//
	// Create a VM, wait until it is ready to go, then run 1 or more provisioning scripts via ssh.
	//
	self.provisionVM = function (vmName, networkName, imageName, user, pass, staticIP, endpoints, provisionScript, templateView) {

		assert.isString(vmName);
		assert.isString(networkName);
		assert.isString(imageName);
		assert.isString(user);
		assert.isString(pass);
		if (staticIP) {
			assert.isString(staticIP);	
		}
		if (endpoints) {
			assert.isArray(endpoints);
		}	

		return self.createVM(vmName, networkName, imageName, user, pass, staticIP, endpoints)
			.then(function () {
				return self.waitVmRunning(vmName);
			})
			.then(function () {
				var hostName = vmName + '.cloudapp.net';
				return self.runProvisioningScripts(hostName, user, pass, provisionScript, templateView);
			});
	};

};

module.exports = function (config) {
	return new Azure(config);
};
