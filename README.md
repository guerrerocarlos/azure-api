# azure-api

A really simple [promise-based](https://blog.domenic.me/youre-missing-the-point-of-promises/) NodeJS API for creation and configuration of Azure resources.

You must have [azure-cli](https://www.npmjs.com/package/azure-cli) [installed](https://www.npmjs.com/package/azure-cli#installation) and [authenticated](https://azure.microsoft.com/en-us/documentation/articles/xplat-cli-connect/) to use this.

This API is used in my [MEAN stack provisioning script](https://github.com/codecapers/provision-azure-mean-stack). It's a good example of how to use this.

Todo (please join the effort!):

- Support for certificates/keys.
- Functions to delete networks and VMs. 
 
To install:

	npm install --save azure-api

Then in your NodeJS script:

	var azure = require('azure-api');

To create a network:

	var networkName = "somenetwork";
	var location = "Australia East";
	
	azure.createNetwork(networkName, location)
		.then(function () {
			// network was created sucessfully.
		})
		.catch(function (err) {
			// some error occurred.
		}); 

To create a VM:

	var vm = {
		name: "somevm",
		networkName: "somenetwork",
		imageName: "b39f27a8b8c64d52b05eac6a62ebad85__Ubuntu_DAILY_BUILD-trusty-14_04_2-LTS-amd64-server-20150708-en-us-30GB",
		user: "username", // User name for the VM.
		pass: "password", // Password for the VM.
		endpoints: ... list of end points ...
	};

	azure.createVM(vm)
		.then(function () {
			// VM was created sucessfully.
		})
		.catch(function (err) {
			// some error occurred.
		}); 
 
End points are specified as follows:

	var endpoints = [
		{
			name: 'HTTP',
			externalPort: 80,
			internalPort: 3000,						
		},
		// etc, etc
	],

To run a provisioning shell script on the remote machine:

	var host = "somevm.cloudapp.net";
	var user = "username";
	var pass = "password";
	var scriptFile = "provision.sh"; // The named script must exist on the local machine.
	
	azure.runSshScript(host, user, pass, scriptFile)
		.then(function () {
			// the script completed successfully.
		})
		.catch(function (err) {
			// some error occurred.
		});
 
You can also call a function that waits for you VM to have started:

	var vmName = "somevm";
	
	azure.waitVmRunning(vmName)
		.then(function () {
			// vm has started.
		})
		.catch(function (err) {
			// some error occurred.
		});

The end result is you can wire all these functions together to provision your cloud:

	var networkName = "somenetwork";
	var location = "Australia East";
	var host = vmName + ".cloudapp.net";

	var vm = {
		name: "somevm",
		networkName: networkName,
		imageName: "b39f27a8b8c64d52b05eac6a62ebad85__Ubuntu_DAILY_BUILD-trusty-14_04_2-LTS-amd64-server-20150708-en-us-30GB",
		user: "username", // User name for the VM.
		pass: "password", // Password for the VM.
		endpoints: ... list of end points ...
	};

	var provisionScriptFile = "provision.sh";
	
	azure.createNetwork(networkName, location)
		.then(function () {
			return azure.createVM(vm);
		})
		.then(function () {
			return azure.waitVmRunning(vm.name);
		})
		.then(function () {
			return azure.runSshScript(host, vm.user, vm.pass, provisionScriptFile)
		})
		.then(function () {
			// provisioning completed successfully.
		})
		.catch(function (err) {
			// some error occurred.
		}); 

Or you could just call *provisionVM*:

	var networkName = "somenetwork";
	var location = "Australia East";

	var vm = {
		name: "somevm",
		networkName: networkName,
		imageName: "b39f27a8b8c64d52b05eac6a62ebad85__Ubuntu_DAILY_BUILD-trusty-14_04_2-LTS-amd64-server-20150708-en-us-30GB",
		user: "username", // User name for the VM.
		pass: "password", // Password for the VM.
		endpoints: ... list of end points ...
		provisionScript: "provision.sh",
	};

	var provisionScriptFile = "provision.sh";
	
	azure.createNetwork(networkName, location)
		.then(function () {
			return azure.provisionVM(vm);
		})
		.then(function () {
			// provisioning completed successfully.
		})
		.catch(function (err) {
			// some error occurred.
		}); 

Have fun! Thanks for coming to the party.