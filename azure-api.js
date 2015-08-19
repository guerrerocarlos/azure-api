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
	self.createVM  = function (vmOptions) {

		assert.isObject(vmOptions);		
		assert.isString(vmOptions.name);
		if (vmOptions.dnsName) {
			assert.isString(vmOptions.dnsName);
		}
		if (vmOptions.networkName) {
			assert.isString(vmOptions.networkName);
		}
		if (vmOptions.location) {
			assert.isString(vmOptions.location);
		}
		assert.isString(vmOptions.imageName);
		assert.isString(vmOptions.user);
		assert.isString(vmOptions.pass);

		if (vmOptions.staticIP) {
			assert.isString(vmOptions.staticIP);
		}
		
		if (vmOptions.endpoints) {
			assert.isArray(vmOptions.endpoints);
		}

		if (vmOptions.sshCertFile) {
			assert.isString(vmOptions.sshCertFile);
		}

		if (vmOptions.networkName && vmOptions.location) {
			throw new Error("Can't specify both 'networkName' and 'location'.");
		}

		if (!vmOptions.networkName && !vmOptions.location) {
			throw new Error("Must specify one of 'networkName' or 'location'.");
		}

		if (verbose) {
			console.log('Creating vm ' + vmOptions.name + ' on network ' + vmOptions.networkName);
		}

		var dnsName = vmOptions.name;
		var vmName = vmOptions.name;

		if (vmOptions.dnsName) {
			dnsName = vmOptions.dnsName;
		}

		var args = [
			'vm',
			'create',
			dnsName,
			vmOptions.imageName,
			vmOptions.user,
			vmOptions.pass,
			'--ssh',
			'--vm-name',
			vmName,
		];

		if (vmOptions.networkName) {
			args.push('--virtual-network-name');
			args.push(vmOptions.networkName);
		}

		if (vmOptions.location) {
			args.push('--location');
			args.push(vmOptions.location);
		}

		if (vmOptions.staticIP) {
			args.push('--static-ip');
			args.push(vmOptions.staticIP);
		}

		if (vmOptions.sshCertFile) {
			args.push('--ssh-cert');
			args.push(vmOptions.sshCertFile);
		}

		return self.runAzureCmd(args)
			.then(function () {
				if (!vmOptions.endpoints) {
					return;
				}

				return E.from(vmOptions.endpoints)
					.aggregate(
						Q(),
						function (prevPromise, endpoint) {
							return prevPromise.then(function () {
									return self.createEndPoint(vmOptions.name, endpoint);
								});
						}
					);
			});
	};

	//
	// Create an endpoint on an existing Azure VM.
	//
	self.createEndPoint = function (vmName, endpoint) {

		assert.isString(vmName);
		assert.isObject(endpoint);
		assert.isNumber(endpoint.externalPort);
		assert.isNumber(endpoint.internalPort);
		assert.isString(endpoint.name);

		if (verbose) {
			console.log('Creating endpoint ' + endpoint.name + ' for ' + vmName);
		}

		var args = [
			'vm',
			'endpoint',
			'create',
			vmName,
			endpoint.externalPort,
			endpoint.internalPort,
			'--name',
			endpoint.name,
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
		return ssh.exec(scriptInstance);
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
			return E.from(provisionScript)
				.aggregate(
					Q(),
					function (previousPromise, script) {
						return previousPromise.then(function () {
							return self.runSshScriptFile(host, user, pass, script, templateView);
						});						
					}
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
	self.provisionVM = function (vm) {

		assert.isObject(vm);
		assert.isString(vm.name);
		if (vm.provisioningTemplateView) {
			assert.isObject(vm.provisioningTemplateView);
		}

		return self.createVM(vm)
			.then(function () {
				return self.waitVmRunning(vm.name);
			})
			.then(function () {
				if (vm.provisionScript) {
					var hostName = (vm.dnsName || vm.name) + '.cloudapp.net';
					return self.runProvisioningScripts(hostName, vm.user, vm.pass, vm.provisionScript, vm.provisioningTemplateView);
				}
			});
	};

};

module.exports = function (config) {
	return new Azure(config);
};
