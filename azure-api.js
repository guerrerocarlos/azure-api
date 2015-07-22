'use strict';

var exec = require('child-process-promise').exec;
var quote = require('quote');
var Q = require('q');
var E = require('linq');
var readAllLines = require('./read-all-lines');
var SshClient = require('ssh-promise');

var azure = {
	//
	// Create an Azure network.
	//
	createNetwork: function (networkName, location) {

		console.log('Creating network: ' + networkName);

		var args = [
			'azure',
			'network',
			'vnet',
			'create',
			networkName,
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
	createVM: function (vmName, networkName, imageName, user, pass, endpoints) {

		console.log('Creating vm ' + vmName + ' on network ' + networkName);

		var args = [
			'azure',
			'vm',
			'create',
			vmName,
			quote(imageName),
			user,
			pass,
			'--virtual-network-name',
			quote(networkName),
			'--ssh',
		];

		return exec(args.join(' '))
			.then(function (output) {
				console.log(output.stdout);
				console.log(output.stderr);
				return output;
			})
			.then(function () {
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

		console.log('Creating endpoint ' + endpointName + ' for ' + vmName);

		var args = [
			'azure',
			'vm',
			'endpoint',
			'create',
			vmName,
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

		var args = [
			'azure',
			'vm',
			'show',
			vmName,
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
		console.log('Waiting for VM to be running');

		return Q.Promise(function (resolve, reject) {
			var checkVmRunning = function () {
				azure.getVmStatus(vmName)
					.then(function (status) {
						var isRunning = status.InstanceStatus === 'ReadyRole';
						if (isRunning) {
							console.log('VM is running');

							resolve();
						}
						else {
							console.log('VM not yet running, current status: ' + status.InstanceStatus);

							checkVmRunning();
						}
					})
					.catch(function (err) {
						console.error('Failed to start VM');
						console.error(err.stack);

						reject(err);
					});
			};

			checkVmRunning();
		});
	},

	//
	// Run a shell script on a particular Azure VM via ssh.
	//
	runSshScript: function (host, user, pass, scriptFilePath) {
		var sshConfig = {
			host: host,
			username: user,
			password: pass,
		};

		var ssh = new SshClient(sshConfig);
		return ssh.exec(readAllLines(scriptFilePath));
	},

};

module.exports = azure;
