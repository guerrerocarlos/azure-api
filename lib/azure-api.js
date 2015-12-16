'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.runAzureCmd = runAzureCmd;
exports.listStorageContainers = listStorageContainers;
exports.deleteCluster = deleteCluster;
exports.createClusterStorage = createClusterStorage;
exports.listJobs = listJobs;
exports.copyDataset = copyDataset;
exports.copyDatasetStatus = copyDatasetStatus;
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

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _promisifyAny = require('promisify-any');

var _promisifyAny2 = _interopRequireDefault(_promisifyAny);

var _npm = require('npm');

var _npm2 = _interopRequireDefault(_npm);

var _quote = require('quote');

var _quote2 = _interopRequireDefault(_quote);

var _linq = require('linq');

var _linq2 = _interopRequireDefault(_linq);

var _sshPromise = require('ssh-promise');

var _sshPromise2 = _interopRequireDefault(_sshPromise);

var _mustache = require('mustache');

var _mustache2 = _interopRequireDefault(_mustache);

var _chai = require('chai');

var _childProcessPromise = require('child-process-promise');

var verbose = true;

//
// Run an Azure command, return a promise.
//

function runAzureCmd(args) {
  var azureCmd, spawnOptions, output;
  return regeneratorRuntime.async(function runAzureCmd$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:

        _chai.assert.isArray(args);
        (0, _chai.assert)(args.length > 0);

        context$1$0.next = 4;
        return regeneratorRuntime.awrap((0, _promisifyAny2['default'])(_npm2['default'].load)({}));

      case 4:
        azureCmd = 'azure';
        spawnOptions = {
          capture: ['stdout', 'stderr']
        };

        if (verbose) {
          console.log('Invoking command: "' + azureCmd + ' ' + args.map(function (arg) {
            return (0, _quote2['default'])(arg);
          }).join(' ') + '"');
        }

        context$1$0.prev = 7;
        context$1$0.next = 10;
        return regeneratorRuntime.awrap((0, _childProcessPromise.spawn)(azureCmd, args, spawnOptions));

      case 10:
        output = context$1$0.sent;

        console.log(output);
        if (verbose) {
          console.log(output.stdout);
          console.log(output.stderr);
        }
        return context$1$0.abrupt('return', output);

      case 16:
        context$1$0.prev = 16;
        context$1$0.t0 = context$1$0['catch'](7);

        if (verbose) {
          console.log(context$1$0.t0.stdout);
          console.log(context$1$0.t0.stderr);
        }
        throw context$1$0.t0;

      case 20:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this, [[7, 16]]);
}

// azure hdinsight cluster delete --osType linux on-demand-cluster10 --location "East US"
//
//

//
// Delete an Azure cluster
//

function listStorageContainers(clOptions) {
  var args, output;
  return regeneratorRuntime.async(function listStorageContainers$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:

        _chai.assert.isObject(clOptions);

        _chai.assert.isString(clOptions.storageAccountName);
        _chai.assert.isString(clOptions.storageAccountKey);

        if (verbose) {
          console.log('Getting storage containers: ' + clOptions.storageAccountName);
        }

        args = ['storage', 'container', 'list', '-a', clOptions.storageAccountName, '-k', clOptions.storageAccountKey, '--json'];
        context$1$0.next = 7;
        return regeneratorRuntime.awrap(runAzureCmd(args));

      case 7:
        output = context$1$0.sent;
        return context$1$0.abrupt('return', JSON.parse(output.stdout));

      case 9:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

//
// Delete an Azure cluster
//

function deleteCluster(clOptions) {
  var args, output;
  return regeneratorRuntime.async(function deleteCluster$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:

        _chai.assert.isObject(clOptions);
        _chai.assert.isString(clOptions.storageAccountName);
        _chai.assert.isString(clOptions.location);

        if (verbose) {
          console.log('Deleting cluster: ' + clOptions.clusterName);
        }

        args = ['hdinsight', 'cluster', 'delete', '--clusterName', clOptions.clusterName, '--osType', 'linux', '--location', clOptions.location, '--json'];
        context$1$0.next = 7;
        return regeneratorRuntime.awrap(runAzureCmd(args));

      case 7:
        output = context$1$0.sent;
        return context$1$0.abrupt('return', JSON.parse(output.stdout));

      case 9:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

//
// Create an Azure cluster storage
//

function createClusterStorage(clOptions) {
  var args, output;
  return regeneratorRuntime.async(function createClusterStorage$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:

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
          console.log('Creating network: ' + clOptions.containerName);
        }

        args = ['storage', 'container', 'create', clOptions.containerName, '--account-name', clOptions.storageAccountName, '--account-key', clOptions.storageAccountKey, '--json'];
        context$1$0.next = 14;
        return regeneratorRuntime.awrap(runAzureCmd(args));

      case 14:
        output = context$1$0.sent;
        return context$1$0.abrupt('return', JSON.parse(output.stdout));

      case 16:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

//
// Get Jobs from Azure cluster
//

function listJobs(clusterDnsName, userName, password) {
  var args, output;
  return regeneratorRuntime.async(function listJobs$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        args = ['hdinsight', 'job', 'list', '--clusterDnsName', clusterDnsName, '--userName', userName, '--password', password, '--json'];
        context$1$0.next = 3;
        return regeneratorRuntime.awrap(runAzureCmd(args));

      case 3:
        output = context$1$0.sent;
        return context$1$0.abrupt('return', JSON.parse(output.stdout));

      case 5:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

//
// Start Copying Datasets from one container to another in another subscription
//

function copyDataset(clOptions) {
  var originAccountKey, originStorageAccountName, originURI, destinationAccountKey, destinationStorageAccountName, destinationContainer, args, output;
  return regeneratorRuntime.async(function copyDataset$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        originAccountKey = clOptions.originAccountKey;
        originStorageAccountName = clOptions.originStorageAccountName;
        originURI = clOptions.originURI;
        destinationAccountKey = clOptions.destinationAccountKey;
        destinationStorageAccountName = clOptions.destinationStorageAccountName;
        destinationContainer = clOptions.destinationContainer;
        args = ['storage', 'blob', 'copy', 'start', '--account-key', originAccountKey, '--account-name', originStorageAccountName, '--source-uri', originURI, '--dest-account-key', destinationAccountKey, '--dest-account-name', destinationStorageAccountName, '--dest-container', destinationContainer, '--json'];
        context$1$0.next = 9;
        return regeneratorRuntime.awrap(runAzureCmd(args));

      case 9:
        output = context$1$0.sent;
        return context$1$0.abrupt('return', JSON.parse(output.stdout));

      case 11:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

//
// Start Copying Datasets from one container to another in another subscription
//

function copyDatasetStatus(clOptions) {
  var originAccountKey, originStorageAccountName, blob, container, args, output;
  return regeneratorRuntime.async(function copyDatasetStatus$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        originAccountKey = clOptions.originAccountKey;
        originStorageAccountName = clOptions.originStorageAccountName;
        blob = clOptions.blob;
        container = clOptions.container;
        args = ['storage', 'blob', 'copy', 'show', '--account-key', originAccountKey, '--account-name', originStorageAccountName, '--blob', blob, '--container', container, '--json'];
        context$1$0.next = 7;
        return regeneratorRuntime.awrap(runAzureCmd(args));

      case 7:
        output = context$1$0.sent;
        return context$1$0.abrupt('return', JSON.parse(output.stdout));

      case 9:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

//
// Get status json for specific Job from specific Azure cluster
//

function jobStatus(clusterDnsName, userName, password, jobId) {
  var args, output;
  return regeneratorRuntime.async(function jobStatus$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        args = ['hdinsight', 'job', 'show', '--clusterDnsName', clusterDnsName, '--userName', userName, '--password', password, '--jobId', jobId, '--json'];
        context$1$0.next = 3;
        return regeneratorRuntime.awrap(runAzureCmd(args));

      case 3:
        output = context$1$0.sent;
        return context$1$0.abrupt('return', JSON.parse(output.stdout));

      case 5:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

//
// Delete an Azure cluster storage
//

function deleteClusterStorage(clOptions) {
  var args, output;
  return regeneratorRuntime.async(function deleteClusterStorage$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:

        if (verbose) {
          console.log('Deleting network: ' + clOptions.containerName);
        }

        args = ['storage', 'container', 'delete', clOptions.containerName, '--account-name', clOptions.storageAccountName, '--account-key', clOptions.storageAccountKey, '--json'];
        context$1$0.next = 4;
        return regeneratorRuntime.awrap(runAzureCmd(args));

      case 4:
        output = context$1$0.sent;
        return context$1$0.abrupt('return', JSON.parse(output.stdout));

      case 6:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

//
// Create an Azure Cluster with an existing storage.
//

function createCluster(clOptions) {
  var args, output;
  return regeneratorRuntime.async(function createCluster$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:

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

        args = ['hdinsight', 'cluster', 'create', '--osType', 'linux', '--storageContainer', clOptions.storageContainer, '--password', clOptions.password, '--sshPassword', clOptions.sshPassword, '--sshUserName', clOptions.sshUserName, '--clusterName', clOptions.clusterName, '--storageAccountName', clOptions.storageAccountName + '.blob.core.windows.net', '--storageAccountKey', clOptions.storageAccountKey, '--dataNodeCount', '4', '--userName', clOptions.userName, '--location', clOptions.location, '--json'];

        if (clOptions.subscription) {
          args.push('--subscription', clOptions.subscription);
        }

        context$1$0.next = 13;
        return regeneratorRuntime.awrap(runAzureCmd(args));

      case 13:
        output = context$1$0.sent;
        return context$1$0.abrupt('return', JSON.parse(output.stdout));

      case 15:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

//
// Create an Azure network.
//

function createNetwork(networkName, location) {
  var args, output;
  return regeneratorRuntime.async(function createNetwork$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:

        _chai.assert.isString(networkName);
        _chai.assert.isString(location);

        if (verbose) {
          console.log('Creating network: ' + networkName);
        }

        args = ['network', 'vnet', 'create', networkName, '-l', location, '--json'];
        context$1$0.next = 6;
        return regeneratorRuntime.awrap(runAzureCmd(args));

      case 6:
        output = context$1$0.sent;
        return context$1$0.abrupt('return', JSON.parse(output.stdout));

      case 8:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

//
// Create an Azure VM in an existing network.
//

function createVM(vmOptions) {
  var dnsName, vmName, args;
  return regeneratorRuntime.async(function createVM$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:

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

        if (!(vmOptions.networkName && vmOptions.location)) {
          context$1$0.next = 14;
          break;
        }

        throw new Error("Can't specify both 'networkName' and 'location'.");

      case 14:
        if (!(!vmOptions.networkName && !vmOptions.location)) {
          context$1$0.next = 16;
          break;
        }

        throw new Error("Must specify one of 'networkName' or 'location'.");

      case 16:

        if (verbose) {
          console.log('Creating vm ' + vmOptions.name + ' on network ' + vmOptions.networkName);
        }

        dnsName = vmOptions.dnsName || vmOptions.name;
        vmName = vmOptions.name;
        args = ['vm', 'create', dnsName, vmOptions.imageName, vmOptions.user, vmOptions.pass, '--ssh', '--json', '--vm-name', vmName];

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

        context$1$0.next = 27;
        return regeneratorRuntime.awrap(runAzureCmd(args));

      case 27:
        if (vmOptions.endpoints) {
          context$1$0.next = 29;
          break;
        }

        return context$1$0.abrupt('return');

      case 29:
        _linq2['default'].from(vmOptions.endpoints).aggregate(Promise.resolve(), function (prevPromise, endpoint) {
          return prevPromise.then(function () {
            return createEndPoint(vmOptions.name, endpoint);
          });
        });

      case 30:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

//
// Create an endpoint on an existing Azure VM.
//

function createEndPoint(vmName, endpoint) {
  var args, output;
  return regeneratorRuntime.async(function createEndPoint$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:

        _chai.assert.isString(vmName);
        _chai.assert.isObject(endpoint);
        _chai.assert.isNumber(endpoint.externalPort);
        _chai.assert.isNumber(endpoint.internalPort);
        _chai.assert.isString(endpoint.name);

        if (verbose) {
          console.log('Creating endpoint ' + endpoint.name + ' for ' + vmName);
        }

        args = ['vm', 'endpoint', 'create', vmName, endpoint.externalPort, endpoint.internalPort, '--name', endpoint.name, '--json'];
        context$1$0.next = 9;
        return regeneratorRuntime.awrap(runAzureCmd(args));

      case 9:
        output = context$1$0.sent;
        return context$1$0.abrupt('return', JSON.parse(output.stdout));

      case 11:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

//
// Get the status of a particular Azure Cluster.
//

function getClusterStatus(clName) {
  var args, output;
  return regeneratorRuntime.async(function getClusterStatus$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:

        _chai.assert.isString(clName);

        args = ['hdinsight', 'cluster', 'show', clName, '--osType', 'linux', '--json'];
        context$1$0.next = 4;
        return regeneratorRuntime.awrap(runAzureCmd(args));

      case 4:
        output = context$1$0.sent;
        return context$1$0.abrupt('return', JSON.parse(output.stdout));

      case 6:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

//
// Get the status of a particular Azure VM.
//

function getVmStatus(vmName) {
  var args, output;
  return regeneratorRuntime.async(function getVmStatus$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:

        _chai.assert.isString(vmName);

        args = ['vm', 'show', vmName, '--json'];
        context$1$0.next = 4;
        return regeneratorRuntime.awrap(runAzureCmd(args));

      case 4:
        output = context$1$0.sent;
        return context$1$0.abrupt('return', JSON.parse(output.stdout));

      case 6:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
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

  var scriptInstance = _mustache2['default'].render(scriptTemplate, templateView);

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

// const azureCmd = path.join(npm.bin, 'azure');

// example command:
// azure storage blob copy start --account-key cl3YyX33ASFbU2u5VkDYdiuH6nXmuEKOEBhbid1RnrvkN5VxUcZp1mTpsTi7iG4CtKNxAbtKd5i5zFfMOnPFRw== --account-name mamutstorage --source-uri https://mamutstorage.blob.core.windows.net/mamutcontainer/mamut/movistar/cdr/data/15090916.mmt.20150909170235.iq.bz2.avro.ad20252b-c209-4e2e-9387-26243ec119d9 --dest-account-name tidchile --dest-account-key CqIGm8MV3s/aLgeMVV529vXJI+NZ6UUuTT89xXYvgxnvIFwauAkljEMsxJCyM7E7QBiWVDHPjIyP24NwZYcV1A== --dest-container tidchile --json
// example output:
/* {
  "container": "tidchile",
  "blob": "mamut/movistar/cdr/data/15090916.mmt.20150909170235.iq.bz2.avro.ad20252b-c209-4e2e-9387-26243ec119d9",
  "etag": "\"0x8D2E52C251D5F93\"",
  "lastModified": "Wed, 04 Nov 2015 15:25:17 GMT",
  "copyStatus": "pending",
  "copyId": "0e5dfe2a-f32d-4279-9614-e82f44d724f8",
  "requestId": "6ae06a9c-0001-005f-6815-17e6f7000000"
} */

// example command:
// azure storage blob copy show --account-key CqIGm8MV3s/aLgeMVV529vXJI+NZ6UUuTT89xXYvgxnvIFwauAkljEMsxJCyM7E7QBiWVDHPjIyP24NwZYcV1A== --account-name tidchile --blob mamut/movistar/cdr/data/15090916.mmt.20150909170235.iq.bz2.avro.ad20252b-c209-4e2e-9387-26243ec119d9 --container tidchile --json
// example output:
/* {
  "container": "tidchile",
  "blob": "mamut/movistar/cdr/data/15090916.mmt.20150909170235.iq.bz2.avro.ad20252b-c209-4e2e-9387-26243ec119d9",
  "metadata": {},
  "etag": "\"0x8D2E48A1421DF28\"",
  "lastModified": "Tue, 03 Nov 2015 20:05:10 GMT",
  "contentType": "application/octet-stream",
  "contentMD5": "2GrLAoFlxC+GOZyKXb+LUg==",
  "contentLength": "355",
  "blobType": "BlockBlob",
  "leaseStatus": "unlocked",
  "leaseState": "available",
  "copySource": "https://mamutstorage.blob.core.windows.net/mamutcontainer/mamut/movistar/cdr/data/15090916.mmt.20150909170235.iq.bz2.avro.ad20252b-c209-4e2e-9387-26243ec119d9",
  "copyStatus": "success",
  "copyCompletionTime": "Tue, 03 Nov 2015 20:05:10 GMT",
  "copyId": "218dc968-2497-4d1e-9324-0e49e6234267",
  "copyProgress": "355/355",
  "requestId": "e2779c4d-0001-0038-6073-165550000000"
}*/