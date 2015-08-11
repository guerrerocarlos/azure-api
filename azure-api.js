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

var azure = {

	//
	// Run an Azure command, return a promise.
	//
	runAzureCmd: function (args) {

		assert.isArray(args);
		assert(args.length > 0);

		var azureCmd = 'azure.cmd';

		var spawnOptions = {
			capture: [ 
				'stdout', 
				'stderr', 
			],
		};

		console.log('Invoking command: "' + azureCmd + ' ' + args.map(function (arg) { return quote(arg); }).join(' ') + '"');

		return spawn(azureCmd, args, spawnOptions) 
			.then(function (output) {
				console.log(output.stdout);
				console.log(output.stderr);
				return output;
			})
			.catch(function (err) {
				console.log(err.stdout);
				console.log(err.stderr);
				throw err;
			});
	},

	//
	// Create an Azure network.
	//
	createNetwork: function (networkName, location) {

		assert.isString(networkName);
		assert.isString(location);

		console.log('Creating network: ' + networkName);

		var args = [
			'network',
			'vnet',
			'create',
			networkName,
			'-l',
			location,
		];

		return azure.runAzureCmd(args);
	},

	//
	// Create an Azure VM in an existing network.
	//
	createVM: function (vmName, networkName, imageName, user, pass, staticIP, endpoints) {
		
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

		console.log('Creating vm ' + vmName + ' on network ' + networkName);

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

		return azure.runAzureCmd(args)
			.then(function () {
				if (!endpoints) {
					return;
				}

				var endPointPromises = E.from(endpoints)
					.select(function (endpoint) {
						return azure.createEndPoint(vmName, endpoint.externalPort, endpoint.internalPort, endpoint.name);
					})
					.toArray();

				return Q.all(endPointPromises);
			});
	},

	//
	// Create an endpoint on an existing Azure VM.
	//
	createEndPoint: function (vmName, externalPort, internalPort, endpointName) {

		assert.isString(vmName);
		assert.isNumber(externalPort);
		assert.isNumber(internalPort);
		assert.isString(endpointName);

		console.log('Creating endpoint ' + endpointName + ' for ' + vmName);

		var args = [
			'vm',
			'endpoint',
			'create',
			vmName,
			externalPort,
			internalPort,
			'--name="' + endpointName + '"',
		];

		return azure.runAzureCmd(args);
	},

	//
	// Get the status of a particular Azure VM.
	//
	getVmStatus: function (vmName) {

		assert.isString(vmName);

		var args = [
			'vm',
			'show',
			vmName,
			'--json',
		];

		return azure.runAzureCmd(args)
			.then(function (output) {
				return JSON.parse(output.stdout);
			});
	},

	//
	// Wait until a particular Azure VM is running.
	// Returns a promise that is resolved when the VM is running.
	//
	waitVmRunning: function (vmName) {

		assert.isString(vmName);

		console.log(vmName + ': Waiting for VM to be running');

		return Q.Promise(function (resolve, reject) {
			var checkVmRunning = function () {
				azure.getVmStatus(vmName)
					.then(function (status) {
						var isRunning = status.InstanceStatus === 'ReadyRole';
						if (isRunning) {
							console.log(vmName + ': VM is running');

							resolve();
						}
						else {
							console.log(vmName + ': VM not yet running, current status: ' + status.InstanceStatus);

							checkVmRunning();
						}
					})
					.catch(function (err) {
						console.error(vmName + ': Error checking VM status.');
						console.error(err.stack);

						checkVmRunning();
					});
			};

			checkVmRunning();
		});
	},

	//
	// Run a templated shell script on a particular Azure VM via ssh.
	//
	runSshScript: function (host, user, pass, scriptTemplate, templateView) {

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
	runSshScriptFile: function (host, user, pass, scriptFilePath, templateView) {

		assert.isString(host);
		assert.isString(user);
		assert.isString(pass);
		assert.isString(scriptFilePath);
		if (templateView) {
			assert.isObject(templateView);
		}

		console.log('Running provisioning script ' + scriptFilePath + ' on VM ' + host);

		var scriptTemplate = fs.readFileSync(scriptFilePath).toString();
		return azure.runSshScript(host, user, pass, scriptTemplate, templateView);
	},

	//
	// Run a single or set of provisioning scripts on the VM.
	//
	runProvisioningScripts: function (host, user, pass, provisionScript, templateView) {

		assert.isString(host);
		assert.isString(user);
		assert.isString(pass);
		if (templateView) {
			assert.isObject(templateView);
		}

		if (util.isArray(provisionScript)) {
			return Q.all(E.from(provisionScript)
				.select(function (script) {
					return azure.runSshScriptFile(host, user, pass, script, templateView)
				})
				.toArray()
			);
		}
		else {
			assert.isString(provisionScript);

			return azure.runSshScriptFile(host, user, pass, provisionScript, templateView);
		}
	},

	//
	// Create a VM, wait until it is ready to go, then run 1 or more provisioning scripts via ssh.
	//
	provisionVM: function (vmName, networkName, imageName, user, pass, staticIP, endpoints, provisionScript, templateView) {

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

		return azure.createVM(vmName, networkName, imageName, user, pass, staticIP, endpoints)
			.then(function () {
				return azure.waitVmRunning(vmName);
			})
			.then(function () {
				var hostName = vmName + '.cloudapp.net';
				return azure.runProvisioningScripts(hostName, user, pass, provisionScript, templateView);
			});
	},

};

module.exports = azure;
