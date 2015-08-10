'use strict';

var exec = require('child-process-promise').exec;
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
	// Create an Azure network.
	//
	createNetwork: function (networkName, location) {

		assert.isString(networkName);
		assert.isString(location);

		console.log('Creating network: ' + networkName);

		var args = [
			'azure',
			'network',
			'vnet',
			'create',
			quote(networkName),
			'-l',
			quote(location),
		];

		return exec(args.join(' '))
			.then(function (output) {
				console.log(output.stdout);
				console.log(output.stderr);
				return output;
			});
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
			'azure',
			'vm',
			'create',
			quote(vmName),
			quote(imageName),
			quote(user),
			quote(pass),
			'--virtual-network-name',
			quote(networkName),
			'--ssh',
		];

		if (staticIP) {
			args.push('--static-ip');
			args.push(staticIP);
		}

		return exec(args.join(' '))
			.then(function (output) {
				console.log(output.stdout);
				console.log(output.stderr);
				return output;
			})
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
		assert.isString(externalPort);
		assert.isString(internalPort);
		assert.isString(endpointName);

		console.log('Creating endpoint ' + endpointName + ' for ' + vmName);

		var args = [
			'azure',
			'vm',
			'endpoint',
			'create',
			quote(vmName),
			externalPort,
			internalPort,
			'--name="' + endpointName + '"',
		];

		return exec(args.join(' '))
			.then(function (output) {
				console.log(output.stdout);
				console.log(output.stderr);
				return output;
			});
	},

	//
	// Get the status of a particular Azure VM.
	//
	getVmStatus: function (vmName) {

		assert.isString(vmName);

		var args = [
			'azure',
			'vm',
			'show',
			quote(vmName),
			'--json',
		];

		return exec(args.join(' '))
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
		return ssh.exec(scriptInstance);
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

};

module.exports = azure;
