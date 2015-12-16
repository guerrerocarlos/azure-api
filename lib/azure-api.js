'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getVmStatus = exports.getClusterStatus = exports.createEndPoint = exports.createVM = exports.createNetwork = exports.createCluster = exports.deleteClusterStorage = exports.jobStatus = exports.copyDatasetStatus = exports.copyDataset = exports.listJobs = exports.createClusterStorage = exports.deleteCluster = exports.listStorageContainers = exports.runAzureCmd = undefined;
exports.waitClusterState = waitClusterState;
exports.waitVmRunning = waitVmRunning;
exports.runSshScript = runSshScript;
exports.runSshScriptFile = runSshScriptFile;
exports.runProvisioningScripts = runProvisioningScripts;
exports.provisionVM = provisionVM;

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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } step("next"); }); }; }

var verbose = true;

//
// Run an Azure command, return a promise.
//

var runAzureCmd = exports.runAzureCmd = (function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(args) {
    var azureCmd, spawnOptions, output;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:

            _chai.assert.isArray(args);
            (0, _chai.assert)(args.length > 0);

            _context.next = 4;
            return (0, _promisifyAny2.default)(_npm2.default.load)({});

          case 4:
            // const azureCmd = path.join(npm.bin, 'azure');
            azureCmd = 'azure';
            spawnOptions = {
              capture: ['stdout', 'stderr']
            };

            if (verbose) {
              console.log('Invoking command: "' + azureCmd + ' ' + args.map(function (arg) {
                return (0, _quote2.default)(arg);
              }).join(' ') + '"');
            }

            _context.prev = 7;
            _context.next = 10;
            return (0, _childProcessPromise.spawn)(azureCmd, args, spawnOptions);

          case 10:
            output = _context.sent;

            console.log(output);
            if (verbose) {
              console.log(output.stdout);
              console.log(output.stderr);
            }
            return _context.abrupt('return', output);

          case 16:
            _context.prev = 16;
            _context.t0 = _context['catch'](7);

            if (verbose) {
              console.log(_context.t0.stdout);
              console.log(_context.t0.stderr);
            }
            throw _context.t0;

          case 20:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[7, 16]]);
  }));

  return function runAzureCmd(_x) {
    return ref.apply(this, arguments);
  };
})();

// azure hdinsight cluster delete --osType linux on-demand-cluster10 --location "East US"
//
//

//
// Delete an Azure cluster
//

var listStorageContainers = exports.listStorageContainers = (function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(clOptions) {
    var args, output;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:

            _chai.assert.isObject(clOptions);

            _chai.assert.isString(clOptions.storageAccountName);
            _chai.assert.isString(clOptions.storageAccountKey);

            if (verbose) {
              console.log('Getting storage containers: ' + clOptions.storageAccountName);
            }

            args = ['storage', 'container', 'list', '-a', clOptions.storageAccountName, '-k', clOptions.storageAccountKey, '--json'];
            _context2.next = 7;
            return runAzureCmd(args);

          case 7:
            output = _context2.sent;
            return _context2.abrupt('return', JSON.parse(output.stdout));

          case 9:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function listStorageContainers(_x2) {
    return ref.apply(this, arguments);
  };
})();

//
// Delete an Azure cluster
//

var deleteCluster = exports.deleteCluster = (function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(clOptions) {
    var args, output;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:

            _chai.assert.isObject(clOptions);
            _chai.assert.isString(clOptions.storageAccountName);
            _chai.assert.isString(clOptions.location);

            if (verbose) {
              console.log('Deleting cluster: ' + clOptions.clusterName);
            }

            args = ['hdinsight', 'cluster', 'delete', '--clusterName', clOptions.clusterName, '--osType', 'linux', '--location', clOptions.location, '--json'];
            _context3.next = 7;
            return runAzureCmd(args);

          case 7:
            output = _context3.sent;
            return _context3.abrupt('return', JSON.parse(output.stdout));

          case 9:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function deleteCluster(_x3) {
    return ref.apply(this, arguments);
  };
})();

//
// Create an Azure cluster storage
//

var createClusterStorage = exports.createClusterStorage = (function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(clOptions) {
    var args, output;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
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
            _context4.next = 14;
            return runAzureCmd(args);

          case 14:
            output = _context4.sent;
            return _context4.abrupt('return', JSON.parse(output.stdout));

          case 16:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function createClusterStorage(_x4) {
    return ref.apply(this, arguments);
  };
})();

//
// Get Jobs from Azure cluster
//

var listJobs = exports.listJobs = (function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(clusterDnsName, userName, password) {
    var args, output;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            args = ['hdinsight', 'job', 'list', '--clusterDnsName', clusterDnsName, '--userName', userName, '--password', password, '--json'];
            _context5.next = 3;
            return runAzureCmd(args);

          case 3:
            output = _context5.sent;
            return _context5.abrupt('return', JSON.parse(output.stdout));

          case 5:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function listJobs(_x5, _x6, _x7) {
    return ref.apply(this, arguments);
  };
})();

//
// Start Copying Datasets from one container to another in another subscription
//

var copyDataset = exports.copyDataset = (function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(clOptions) {
    var originAccountKey, originStorageAccountName, originURI, destinationAccountKey, destinationStorageAccountName, destinationContainer, args, output;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
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
            originAccountKey = clOptions.originAccountKey;
            originStorageAccountName = clOptions.originStorageAccountName;
            originURI = clOptions.originURI;
            destinationAccountKey = clOptions.destinationAccountKey;
            destinationStorageAccountName = clOptions.destinationStorageAccountName;
            destinationContainer = clOptions.destinationContainer;
            args = ['storage', 'blob', 'copy', 'start', '--account-key', originAccountKey, '--account-name', originStorageAccountName, '--source-uri', originURI, '--dest-account-key', destinationAccountKey, '--dest-account-name', destinationStorageAccountName, '--dest-container', destinationContainer, '--json'];
            _context6.next = 9;
            return runAzureCmd(args);

          case 9:
            output = _context6.sent;
            return _context6.abrupt('return', JSON.parse(output.stdout));

          case 11:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function copyDataset(_x8) {
    return ref.apply(this, arguments);
  };
})();

//
// Start Copying Datasets from one container to another in another subscription
//

var copyDatasetStatus = exports.copyDatasetStatus = (function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(clOptions) {
    var originAccountKey, originStorageAccountName, blob, container, args, output;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
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

            originAccountKey = clOptions.originAccountKey;
            originStorageAccountName = clOptions.originStorageAccountName;
            blob = clOptions.blob;
            container = clOptions.container;
            args = ['storage', 'blob', 'copy', 'show', '--account-key', originAccountKey, '--account-name', originStorageAccountName, '--blob', blob, '--container', container, '--json'];
            _context7.next = 7;
            return runAzureCmd(args);

          case 7:
            output = _context7.sent;
            return _context7.abrupt('return', JSON.parse(output.stdout));

          case 9:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, this);
  }));

  return function copyDatasetStatus(_x9) {
    return ref.apply(this, arguments);
  };
})();

//
// Get status json for specific Job from specific Azure cluster
//

var jobStatus = exports.jobStatus = (function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee8(clusterDnsName, userName, password, jobId) {
    var args, output;
    return regeneratorRuntime.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            args = ['hdinsight', 'job', 'show', '--clusterDnsName', clusterDnsName, '--userName', userName, '--password', password, '--jobId', jobId, '--json'];
            _context8.next = 3;
            return runAzureCmd(args);

          case 3:
            output = _context8.sent;
            return _context8.abrupt('return', JSON.parse(output.stdout));

          case 5:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, this);
  }));

  return function jobStatus(_x10, _x11, _x12, _x13) {
    return ref.apply(this, arguments);
  };
})();

//
// Delete an Azure cluster storage
//

var deleteClusterStorage = exports.deleteClusterStorage = (function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee9(clOptions) {
    var args, output;
    return regeneratorRuntime.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:

            if (verbose) {
              console.log('Deleting network: ' + clOptions.containerName);
            }

            args = ['storage', 'container', 'delete', clOptions.containerName, '--account-name', clOptions.storageAccountName, '--account-key', clOptions.storageAccountKey, '--json'];
            _context9.next = 4;
            return runAzureCmd(args);

          case 4:
            output = _context9.sent;
            return _context9.abrupt('return', JSON.parse(output.stdout));

          case 6:
          case 'end':
            return _context9.stop();
        }
      }
    }, _callee9, this);
  }));

  return function deleteClusterStorage(_x14) {
    return ref.apply(this, arguments);
  };
})();

//
// Create an Azure Cluster with an existing storage.
//

var createCluster = exports.createCluster = (function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee10(clOptions) {
    var args, output;
    return regeneratorRuntime.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
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

            _context10.next = 13;
            return runAzureCmd(args);

          case 13:
            output = _context10.sent;
            return _context10.abrupt('return', JSON.parse(output.stdout));

          case 15:
          case 'end':
            return _context10.stop();
        }
      }
    }, _callee10, this);
  }));

  return function createCluster(_x15) {
    return ref.apply(this, arguments);
  };
})();

//
// Create an Azure network.
//

var createNetwork = exports.createNetwork = (function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee11(networkName, location) {
    var args, output;
    return regeneratorRuntime.wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:

            _chai.assert.isString(networkName);
            _chai.assert.isString(location);

            if (verbose) {
              console.log('Creating network: ' + networkName);
            }

            args = ['network', 'vnet', 'create', networkName, '-l', location, '--json'];
            _context11.next = 6;
            return runAzureCmd(args);

          case 6:
            output = _context11.sent;
            return _context11.abrupt('return', JSON.parse(output.stdout));

          case 8:
          case 'end':
            return _context11.stop();
        }
      }
    }, _callee11, this);
  }));

  return function createNetwork(_x16, _x17) {
    return ref.apply(this, arguments);
  };
})();

//
// Create an Azure VM in an existing network.
//

var createVM = exports.createVM = (function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee12(vmOptions) {
    var dnsName, vmName, args;
    return regeneratorRuntime.wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
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
              _context12.next = 14;
              break;
            }

            throw new Error("Can't specify both 'networkName' and 'location'.");

          case 14:
            if (!(!vmOptions.networkName && !vmOptions.location)) {
              _context12.next = 16;
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

            _context12.next = 27;
            return runAzureCmd(args);

          case 27:
            if (vmOptions.endpoints) {
              _context12.next = 29;
              break;
            }

            return _context12.abrupt('return');

          case 29:
            _linq2.default.from(vmOptions.endpoints).aggregate(Promise.resolve(), function (prevPromise, endpoint) {
              return prevPromise.then(function () {
                return createEndPoint(vmOptions.name, endpoint);
              });
            });

          case 30:
          case 'end':
            return _context12.stop();
        }
      }
    }, _callee12, this);
  }));

  return function createVM(_x18) {
    return ref.apply(this, arguments);
  };
})();

//
// Create an endpoint on an existing Azure VM.
//

var createEndPoint = exports.createEndPoint = (function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee13(vmName, endpoint) {
    var args, output;
    return regeneratorRuntime.wrap(function _callee13$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
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
            _context13.next = 9;
            return runAzureCmd(args);

          case 9:
            output = _context13.sent;
            return _context13.abrupt('return', JSON.parse(output.stdout));

          case 11:
          case 'end':
            return _context13.stop();
        }
      }
    }, _callee13, this);
  }));

  return function createEndPoint(_x19, _x20) {
    return ref.apply(this, arguments);
  };
})();

//
// Get the status of a particular Azure Cluster.
//

var getClusterStatus = exports.getClusterStatus = (function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee14(clName) {
    var args, output;
    return regeneratorRuntime.wrap(function _callee14$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:

            _chai.assert.isString(clName);

            args = ['hdinsight', 'cluster', 'show', clName, '--osType', 'linux', '--json'];
            _context14.next = 4;
            return runAzureCmd(args);

          case 4:
            output = _context14.sent;
            return _context14.abrupt('return', JSON.parse(output.stdout));

          case 6:
          case 'end':
            return _context14.stop();
        }
      }
    }, _callee14, this);
  }));

  return function getClusterStatus(_x21) {
    return ref.apply(this, arguments);
  };
})();

//
// Get the status of a particular Azure VM.
//

var getVmStatus = exports.getVmStatus = (function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee15(vmName) {
    var args, output;
    return regeneratorRuntime.wrap(function _callee15$(_context15) {
      while (1) {
        switch (_context15.prev = _context15.next) {
          case 0:

            _chai.assert.isString(vmName);

            args = ['vm', 'show', vmName, '--json'];
            _context15.next = 4;
            return runAzureCmd(args);

          case 4:
            output = _context15.sent;
            return _context15.abrupt('return', JSON.parse(output.stdout));

          case 6:
          case 'end':
            return _context15.stop();
        }
      }
    }, _callee15, this);
  }));

  return function getVmStatus(_x22) {
    return ref.apply(this, arguments);
  };
})();

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
      }).catch(function (err) {
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
      }).catch(function (err) {
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

  var scriptInstance = _mustache2.default.render(scriptTemplate, templateView);

  var ssh = new _sshPromise2.default(sshConfig);
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

  var scriptTemplate = _fs2.default.readFileSync(scriptFilePath).toString();
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

  if (_util2.default.isArray(provisionScript)) {
    return _linq2.default.from(provisionScript).aggregate(Promise.resolve(), function (previousPromise, script) {
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