'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.runAzureCmd = runAzureCmd;
exports.listStorageContainers = listStorageContainers;
exports.deleteCluster = deleteCluster;
exports.createClusterStorage = createClusterStorage;
exports.listJobs = listJobs;
exports.jobStatus = jobStatus;
exports.deleteClusterStorage = deleteClusterStorage;
exports.createCluster = createCluster;
exports.createNetwork = createNetwork;
exports.createVM = createVM;
exports.createEndPoint = createEndPoint;
exports.getClusterStatus = getClusterStatus;
exports.getVmStatus = getVmStatus;
exports.waitClusterState = waitClusterState;
exports.waitVmRunning = waitVmRunning;
exports.runSshScript = runSshScript;
exports.runSshScriptFile = runSshScriptFile;
exports.runProvisioningScripts = runProvisioningScripts;
exports.provisionVM = provisionVM;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _quote = require('quote');

var _quote2 = _interopRequireDefault(_quote);

var _linq = require('linq');

var _linq2 = _interopRequireDefault(_linq);

var _sshPromise = require('ssh-promise');

var _sshPromise2 = _interopRequireDefault(_sshPromise);

var _Mustache = require('Mustache');

var _Mustache2 = _interopRequireDefault(_Mustache);

var _chai = require('chai');

var _childProcessPromise = require('child-process-promise');

var verbose = false;

//
// Run an Azure command, return a promise.
//

function runAzureCmd(args) {

  _chai.assert.isArray(args);
  (0, _chai.assert)(args.length > 0);

  var azureCmd = _path2['default'].join(__dirname, 'node_modules', '.bin', 'azure');

  var spawnOptions = {
    capture: ['stdout', 'stderr']
  };

  if (verbose) {
    console.log('Invoking command: "' + azureCmd + ' ' + args.map(function (arg) {
      return (0, _quote2['default'])(arg);
    }).join(' ') + '"');
  }

  return (0, _childProcessPromise.spawn)(azureCmd, args, spawnOptions).then(function (output) {
    if (verbose) {
      console.log(output.stdout);
      console.log(output.stderr);
    }
    return output;
  })['catch'](function (err) {
    if (verbose) {
      console.log(err.stdout);
      console.log(err.stderr);
    }
    throw err;
  });
}

// azure hdinsight cluster delete --osType linux on-demand-cluster10 --location "East US"
//
//

//
// Delete an Azure cluster
//

function listStorageContainers(clOptions) {

  _chai.assert.isObject(clOptions);

  _chai.assert.isString(clOptions.storageAccountName);
  _chai.assert.isString(clOptions.storageAccountKey);

  if (verbose) {
    console.log('Getting storage containers: ' + clOptions.storageAccountName);
  }

  var args = ['storage', 'container', 'list', '-a', clOptions.storageAccountName, '-k', clOptions.storageAccountKey, '--json'];

  return runAzureCmd(args).then(function (output) {
    return JSON.parse(output.stdout);
  });
}

//
// Delete an Azure cluster
//

function deleteCluster(clOptions) {

  _chai.assert.isObject(clOptions);

  _chai.assert.isString(clOptions.storageContainer);
  _chai.assert.isString(clOptions.password);
  _chai.assert.isString(clOptions.sshPassword);
  _chai.assert.isString(clOptions.sshUserName);
  _chai.assert.isString(clOptions.clusterName);
  _chai.assert.isString(clOptions.storageAccountName);
  _chai.assert.isString(clOptions.storageAccountKey);
  _chai.assert.isString(clOptions.userName);
  _chai.assert.isString(clOptions.location);

  if (verbose) {
    console.log('Deleting cluster: ' + clOptions.clusterName);
  }

  var args = ['hdinsight', 'cluster', 'delete', clOptions.clusterName, '--osType', clOptions.osType, '--location', clOptions.location, '--storageAccountName', clOptions.storageAccountName, '--storageAccountKey', clOptions.storageAccountKey];

  return runAzureCmd(args);
}

//
// Create an Azure cluster storage
//

function createClusterStorage(clOptions) {

  _chai.assert.isObject(clOptions);

  _chai.assert.isString(clOptions.storageContainer);
  _chai.assert.isString(clOptions.password);
  _chai.assert.isString(clOptions.sshPassword);
  _chai.assert.isString(clOptions.sshUserName);
  _chai.assert.isString(clOptions.clusterName);
  _chai.assert.isString(clOptions.storageAccountName);
  _chai.assert.isString(clOptions.storageAccountKey);
  _chai.assert.isString(clOptions.userName);
  _chai.assert.isString(clOptions.location);

  if (verbose) {
    console.log('Creatting network: ' + clOptions.containerName);
  }

  var args = ['storage', 'container', 'create', clOptions.containerName, '--account-name', clOptions.storageAccountName, '--account-key', clOptions.storageAccountKey];

  return runAzureCmd(args);
}

//
// Get Jobs from Azure cluster
//

function listJobs(clusterDnsName, userName, password) {

  var args = ['hdinsight', 'job', 'list', '--clusterDnsName', clusterDnsName, '--userName', userName, '--password', password, '--json'];

  return runAzureCmd(args).then(function (output) {
    return JSON.parse(output.stdout);
  });
}

//
// Get status json for specific Job from specific Azure cluster
//

function jobStatus(clusterDnsName, userName, password, jobId) {

  var args = ['hdinsight', 'job', 'show', '--clusterDnsName', clusterDnsName, '--userName', userName, '--password', password, '--jobId', jobId, '--json'];

  return runAzureCmd(args).then(function (output) {
    return JSON.parse(output.stdout);
  });
}

//
// Delete an Azure cluster storage
//

function deleteClusterStorage(clOptions) {

  if (verbose) {
    console.log('Deleting network: ' + clOptions.containerName);
  }

  var args = ['storage', 'container', 'delete', clOptions.containerName, '--account-name', clOptions.storageAccountName, '--account-key', clOptions.storageAccountKey];

  return runAzureCmd(args);
}

//
// Create an Azure Cluster with an existing storage.
//

function createCluster(clOptions) {

  _chai.assert.isObject(clOptions);

  _chai.assert.isString(clOptions.storageContainer);
  _chai.assert.isString(clOptions.password);
  _chai.assert.isString(clOptions.sshPassword);
  _chai.assert.isString(clOptions.sshUserName);
  _chai.assert.isString(clOptions.clusterName);
  // assert.isString(clOptions.storageAccountName);
  // assert.isString(clOptions.storageAccountKey);
  _chai.assert.isString(clOptions.userName);
  _chai.assert.isString(clOptions.location);

  if (verbose) {
    console.log('Creating cluster ' + clOptions.clusterName);
  }

  var args = ['hdinsight', 'cluster', 'create', '--osType', 'linux', '--storageContainer', clOptions.storageContainer, '--password', clOptions.password, '--sshPassword', clOptions.sshPassword, '--sshUserName', clOptions.sshUserName, '--clusterName', clOptions.clusterName, '--storageAccountName', clOptions.storageAccountName + '.blob.core.windows.net', '--storageAccountKey', clOptions.storageAccountKey, '--dataNodeCount', '4', '--userName', clOptions.userName, '--location', clOptions.location];
  if (clOptions.subscription) {
    args.push('--suscription', clOptions.subscription);
  }
  args.push('--json');

  return runAzureCmd(args);
}

//
// Create an Azure network.
//

function createNetwork(networkName, location) {

  _chai.assert.isString(networkName);
  _chai.assert.isString(location);

  if (verbose) {
    console.log('Creating network: ' + networkName);
  }

  var args = ['network', 'vnet', 'create', networkName, '-l', location];

  return runAzureCmd(args);
}

//
// Create an Azure VM in an existing network.
//

function createVM(vmOptions) {

  _chai.assert.isObject(vmOptions);
  _chai.assert.isString(vmOptions.name);
  if (vmOptions.dnsName) {
    _chai.assert.isString(vmOptions.dnsName);
  }
  if (vmOptions.networkName) {
    _chai.assert.isString(vmOptions.networkName);
  }
  if (vmOptions.location) {
    _chai.assert.isString(vmOptions.location);
  }
  _chai.assert.isString(vmOptions.imageName);
  _chai.assert.isString(vmOptions.user);
  _chai.assert.isString(vmOptions.pass);

  if (vmOptions.staticIP) {
    _chai.assert.isString(vmOptions.staticIP);
  }

  if (vmOptions.endpoints) {
    _chai.assert.isArray(vmOptions.endpoints);
  }

  if (vmOptions.sshCertFile) {
    _chai.assert.isString(vmOptions.sshCertFile);
  }

  if (vmOptions.vmSize) {
    _chai.assert.isString(vmOptions.vmSize);
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

  var dnsName = vmOptions.dnsName || vmOptions.name;
  var vmName = vmOptions.name;

  var args = ['vm', 'create', dnsName, vmOptions.imageName, vmOptions.user, vmOptions.pass, '--ssh', '--vm-name', vmName];

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

  if (vmOptions.vmSize) {
    args.push('--vm-size');
    args.push(vmOptions.vmSize);
  }

  return runAzureCmd(args).then(function () {
    if (!vmOptions.endpoints) {
      return;
    }
    _linq2['default'].from(vmOptions.endpoints).aggregate(Promise.resolve(), function (prevPromise, endpoint) {
      return prevPromise.then(function () {
        return createEndPoint(vmOptions.name, endpoint);
      });
    });
  });
}

//
// Create an endpoint on an existing Azure VM.
//

function createEndPoint(vmName, endpoint) {

  _chai.assert.isString(vmName);
  _chai.assert.isObject(endpoint);
  _chai.assert.isNumber(endpoint.externalPort);
  _chai.assert.isNumber(endpoint.internalPort);
  _chai.assert.isString(endpoint.name);

  if (verbose) {
    console.log('Creating endpoint ' + endpoint.name + ' for ' + vmName);
  }

  var args = ['vm', 'endpoint', 'create', vmName, endpoint.externalPort, endpoint.internalPort, '--name', endpoint.name];

  return runAzureCmd(args);
}

//
// Get the status of a particular Azure Cluster.
//

function getClusterStatus(clName) {

  _chai.assert.isString(clName);

  var args = ['hdinsight', 'cluster', 'show', clName, '--osType', 'linux', '--json'];

  return runAzureCmd(args).then(function (output) {
    return JSON.parse(output.stdout);
  });
}

//
// Get the status of a particular Azure VM.
//

function getVmStatus(vmName) {

  _chai.assert.isString(vmName);

  var args = ['vm', 'show', vmName, '--json'];

  return runAzureCmd(args).then(function (output) {
    return JSON.parse(output.stdout);
  });
}

//
// Wait until a particular Azure Cluster is running.
// Returns a promise that is resolved when the Cluster is in <state>
//

function waitClusterState(clOptions, state) {
  console.log('Inside waitClusterState');

  var clName = clOptions.clusterName;
  _chai.assert.isString(clName);

  if (verbose) {
    console.log(clName + ': Waiting for Cluster to be ' + state);
  }

  return new Promise(function (resolve, reject) {
    var checkClState = function checkClState() {

      getClusterStatus(clName).then(function (status) {
        if (verbose) {
          console.log('>> GotClusterStatus:');
          console.log(status);
        }
        var isRunning = status.state === state;
        var isError = status.state === 'Error';
        if (isRunning) {
          if (verbose) {
            console.log(clName + ': Cluster is ' + state);
            console.log('>>>><<<<<<<>>>>>>><<<<<<<< RESOLVED!!!!!');
          }
          resolve(status);
        } else {
          if (isError) {
            console.log('Error result has been found.');
            reject(status);
          } else {
            if (verbose) {
              console.log(clName + ': Cluster not yet ' + state + ', current status: ' + status.state);
            }
            checkClState();
          }
        }
      })['catch'](function (err) {
        if (verbose) {
          console.error(clName + ': Error checking Cluster status.');
          console.error(err.stack);
        }

        checkClState();
      });
    };

    checkClState();
  });
}

//
// Wait until a particular Azure VM is running.
// Returns a promise that is resolved when the VM is running.
//

function waitVmRunning(vmName) {

  _chai.assert.isString(vmName);

  if (verbose) {
    console.log(vmName + ': Waiting for VM to be running');
  }

  return new Promise(function (resolve /* , reject */) {
    var checkVmRunning = function checkVmRunning() {
      getVmStatus(vmName).then(function (status) {
        var isRunning = status.InstanceStatus === 'ReadyRole';
        if (isRunning) {
          if (verbose) {
            console.log(vmName + ': VM is running');
          }
          resolve();
        } else {
          if (verbose) {
            console.log(vmName + ': VM not yet running, current status: ' + status.InstanceStatus);
          }
          checkVmRunning();
        }
      })['catch'](function (err) {
        if (verbose) {
          console.error(vmName + ': Error checking VM status.');
          console.error(err.stack);
        }
        checkVmRunning();
      });
    };
    checkVmRunning();
  });
}

//
// Run a templated shell script on a particular Azure VM via ssh.
//

function runSshScript(host, user, pass, scriptTemplate, templateView) {

  _chai.assert.isString(host);
  _chai.assert.isString(user);
  _chai.assert.isString(pass);
  _chai.assert.isString(scriptTemplate);
  if (templateView) {
    _chai.assert.isObject(templateView);
  }

  var sshConfig = {
    host: host,
    username: user,
    password: pass
  };

  var scriptInstance = _Mustache2['default'].render(scriptTemplate, templateView);

  var ssh = new _sshPromise2['default'](sshConfig);
  return ssh.exec(scriptInstance);
}

//
// Run a templated shell script on a particular Azure VM via ssh.
//

function runSshScriptFile(host, user, pass, scriptFilePath, templateView) {

  _chai.assert.isString(host);
  _chai.assert.isString(user);
  _chai.assert.isString(pass);
  _chai.assert.isString(scriptFilePath);
  if (templateView) {
    _chai.assert.isObject(templateView);
  }

  if (verbose) {
    console.log('Running provisioning script ' + scriptFilePath + ' on VM ' + host);
  }

  var scriptTemplate = _fs2['default'].readFileSync(scriptFilePath).toString();
  return runSshScript(host, user, pass, scriptTemplate, templateView);
}

//
// Run a single or set of provisioning scripts on the VM.
//

function runProvisioningScripts(host, user, pass, provisionScript, templateView) {

  _chai.assert.isString(host);
  _chai.assert.isString(user);
  _chai.assert.isString(pass);
  if (templateView) {
    _chai.assert.isObject(templateView);
  }

  if (_util2['default'].isArray(provisionScript)) {
    return _linq2['default'].from(provisionScript).aggregate(Promise.resolve(), function (previousPromise, script) {
      return previousPromise.then(function () {
        return runSshScriptFile(host, user, pass, script, templateView);
      });
    });
  }
  _chai.assert.isString(provisionScript);
  return runSshScriptFile(host, user, pass, provisionScript, templateView);
}

//
// Create a VM, wait until it is ready to go, then run 1 or more provisioning scripts via ssh.
//

function provisionVM(vm) {

  _chai.assert.isObject(vm);
  _chai.assert.isString(vm.name);
  if (vm.provisioningTemplateView) {
    _chai.assert.isObject(vm.provisioningTemplateView);
  }

  return createVM(vm).then(function () {
    return waitVmRunning(vm.name);
  }).then(function () {
    if (vm.provisionScript) {
      var hostName = (vm.dnsName || vm.name) + '.cloudapp.net';
      return runProvisioningScripts(hostName, vm.user, vm.pass, vm.provisionScript, vm.provisioningTemplateView);
    }
  });
}