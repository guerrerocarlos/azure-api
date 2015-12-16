import util from 'util';
import fs from 'fs';
import promisify from 'promisify-any';
import npm from 'npm';
import quote from 'quote';
import linq from 'linq';
import SshClient from 'ssh-promise';
import Mustache from 'mustache';
import {assert} from 'chai';
import {spawn} from 'child-process-promise';

const verbose = true;

//
// Run an Azure command, return a promise.
//
export async function runAzureCmd(args) {

  assert.isArray(args);
  assert(args.length > 0);

  await promisify(npm.load)({});
  // const azureCmd = path.join(npm.bin, 'azure');
  const azureCmd = 'azure';

  const spawnOptions = {
    capture: [
      'stdout',
      'stderr',
    ],
  };
  if (verbose) {
    console.log('Invoking command: "' + azureCmd + ' ' + args.map(arg => quote(arg)).join(' ') + '"');
  }

  try {
    const output = await spawn(azureCmd, args, spawnOptions);
    console.log(output);
    if (verbose) {
      console.log(output.stdout);
      console.log(output.stderr);
    }
    return output;
  } catch (err) {
    if (verbose) {
      console.log(err.stdout);
      console.log(err.stderr);
    }
    throw err;
  }
}

// azure hdinsight cluster delete --osType linux on-demand-cluster10 --location "East US"
//
//

//
// Delete an Azure cluster
//
export async function listStorageContainers(clOptions) {

  assert.isObject(clOptions);

  assert.isString(clOptions.storageAccountName);
  assert.isString(clOptions.storageAccountKey);

  if (verbose) {
    console.log('Getting storage containers: ' + clOptions.storageAccountName);
  }

  const args = [
    'storage',
    'container',
    'list',
    '-a', clOptions.storageAccountName,
    '-k', clOptions.storageAccountKey,
    '--json',
  ];

  const output = await runAzureCmd(args);
  return JSON.parse(output.stdout);
}


//
// Delete an Azure cluster
//
export async function deleteCluster(clOptions) {

  assert.isObject(clOptions);
  assert.isString(clOptions.storageAccountName);
  assert.isString(clOptions.location);

  if (verbose) {
    console.log('Deleting cluster: ' + clOptions.clusterName);
  }

  const args = [
    'hdinsight',
    'cluster',
    'delete',
    '--clusterName', clOptions.clusterName,
    '--osType', 'linux',
    '--location', clOptions.location,
    '--json',
  ];

  const output = await runAzureCmd(args);
  return JSON.parse(output.stdout);
}


//
// Create an Azure cluster storage
//
export async function createClusterStorage(clOptions) {


  assert.isObject(clOptions);

  assert.isString(clOptions.storageContainer);
  assert.isString(clOptions.password);
  assert.isString(clOptions.sshPassword);
  assert.isString(clOptions.sshUserName);
  assert.isString(clOptions.clusterName);
  assert.isString(clOptions.storageAccountName);
  assert.isString(clOptions.storageAccountKey);
  assert.isString(clOptions.userName);
  assert.isString(clOptions.location);


  if (verbose) {
    console.log('Creating network: ' + clOptions.containerName);
  }

  const args = [
    'storage',
    'container',
    'create',
    clOptions.containerName,
    '--account-name', clOptions.storageAccountName,
    '--account-key', clOptions.storageAccountKey,
    '--json',
  ];

  const output = await runAzureCmd(args);
  return JSON.parse(output.stdout);
}


//
// Get Jobs from Azure cluster
//
export async function listJobs(clusterDnsName, userName, password) {

  const args = [
    'hdinsight',
    'job',
    'list',
    '--clusterDnsName', clusterDnsName,
    '--userName', userName,
    '--password', password,
    '--json',
  ];

  const output = await runAzureCmd(args);
  return JSON.parse(output.stdout);
}

//
// Start Copying Datasets from one container to another in another subscription
//
export async function copyDataset(clOptions) {
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
  const originAccountKey = clOptions.originAccountKey;
  const originStorageAccountName = clOptions.originStorageAccountName;
  const originURI = clOptions.originURI;
  const destinationAccountKey = clOptions.destinationAccountKey;
  const destinationStorageAccountName = clOptions.destinationStorageAccountName;
  const destinationContainer = clOptions.destinationContainer;

  const args = [
    'storage',
    'blob',
    'copy',
    'start',
    '--account-key', originAccountKey,
    '--account-name', originStorageAccountName,
    '--source-uri', originURI,
    '--dest-account-key', destinationAccountKey,
    '--dest-account-name', destinationStorageAccountName,
    '--dest-container', destinationContainer,
    '--json',
  ];

  const output = await runAzureCmd(args);
  return JSON.parse(output.stdout);
}


//
// Start Copying Datasets from one container to another in another subscription
//
export async function copyDatasetStatus(clOptions) {
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

  const originAccountKey = clOptions.originAccountKey;
  const originStorageAccountName = clOptions.originStorageAccountName;
  const blob = clOptions.blob;
  const container = clOptions.container;

  const args = [
    'storage',
    'blob',
    'copy',
    'show',
    '--account-key', originAccountKey,
    '--account-name', originStorageAccountName,
    '--blob', blob,
    '--container', container,
    '--json',
  ];

  const output = await runAzureCmd(args);
  return JSON.parse(output.stdout);
}


//
// Get status json for specific Job from specific Azure cluster
//
export async function jobStatus(clusterDnsName, userName, password, jobId) {

  const args = [
    'hdinsight',
    'job',
    'show',
    '--clusterDnsName', clusterDnsName,
    '--userName', userName,
    '--password', password,
    '--jobId', jobId,
    '--json',
  ];

  const output = await runAzureCmd(args);
  return JSON.parse(output.stdout);
}


//
// Delete an Azure cluster storage
//
export async function deleteClusterStorage(clOptions) {

  if (verbose) {
    console.log('Deleting network: ' + clOptions.containerName);
  }

  const args = [
    'storage',
    'container',
    'delete',
    clOptions.containerName,
    '--account-name', clOptions.storageAccountName,
    '--account-key', clOptions.storageAccountKey,
    '--json',
  ];

  const output = await runAzureCmd(args);
  return JSON.parse(output.stdout);
}


//
// Create an Azure Cluster with an existing storage.
//
export async function createCluster(clOptions) {

  assert.isObject(clOptions);

  assert.isString(clOptions.storageContainer);
  assert.isString(clOptions.password);
  assert.isString(clOptions.sshPassword);
  assert.isString(clOptions.sshUserName);
  assert.isString(clOptions.clusterName);
  // assert.isString(clOptions.storageAccountName);
  // assert.isString(clOptions.storageAccountKey);
  assert.isString(clOptions.userName);
  assert.isString(clOptions.location);

  if (verbose) {
    console.log('Creating cluster ' + clOptions.clusterName);
  }

  const args = [
    'hdinsight',
    'cluster',
    'create',
    '--osType', 'linux',
    '--storageContainer', clOptions.storageContainer,
    '--password', clOptions.password,
    '--sshPassword', clOptions.sshPassword,
    '--sshUserName', clOptions.sshUserName,
    '--clusterName', clOptions.clusterName,
    '--storageAccountName', clOptions.storageAccountName + '.blob.core.windows.net',
    '--storageAccountKey', clOptions.storageAccountKey,
    '--dataNodeCount', '4',
    '--userName', clOptions.userName,
    '--location', clOptions.location,
    '--json',
  ];
  if (clOptions.subscription) {
    args.push('--subscription', clOptions.subscription);
  }

  const output = await runAzureCmd(args);
  return JSON.parse(output.stdout);
}

//
// Create an Azure network.
//
export async function createNetwork(networkName, location) {

  assert.isString(networkName);
  assert.isString(location);

  if (verbose) {
    console.log('Creating network: ' + networkName);
  }

  const args = [
    'network',
    'vnet',
    'create',
    networkName,
    '-l',
    location,
    '--json',
  ];

  const output = await runAzureCmd(args);
  return JSON.parse(output.stdout);
}

//
// Create an Azure VM in an existing network.
//
export async function createVM(vmOptions) {

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

  if (vmOptions.vmSize) {
    assert.isString(vmOptions.vmSize);
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

  const dnsName = vmOptions.dnsName || vmOptions.name;
  const vmName = vmOptions.name;

  const args = [
    'vm',
    'create',
    dnsName,
    vmOptions.imageName,
    vmOptions.user,
    vmOptions.pass,
    '--ssh',
    '--json',
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

  if (vmOptions.vmSize) {
    args.push('--vm-size');
    args.push(vmOptions.vmSize);
  }

  await runAzureCmd(args);

  if (!vmOptions.endpoints) {
    return;
  }
  linq.from(vmOptions.endpoints)
    .aggregate(
      Promise.resolve(),
      (prevPromise, endpoint) => {
        return prevPromise.then(() => {
          return createEndPoint(vmOptions.name, endpoint);
        });
      }
    );
}

//
// Create an endpoint on an existing Azure VM.
//
export async function createEndPoint(vmName, endpoint) {

  assert.isString(vmName);
  assert.isObject(endpoint);
  assert.isNumber(endpoint.externalPort);
  assert.isNumber(endpoint.internalPort);
  assert.isString(endpoint.name);

  if (verbose) {
    console.log('Creating endpoint ' + endpoint.name + ' for ' + vmName);
  }

  const args = [
    'vm',
    'endpoint',
    'create',
    vmName,
    endpoint.externalPort,
    endpoint.internalPort,
    '--name',
    endpoint.name,
    '--json',
  ];

  const output = await runAzureCmd(args);
  return JSON.parse(output.stdout);
}

//
// Get the status of a particular Azure Cluster.
//
export async function getClusterStatus(clName) {

  assert.isString(clName);

  const args = [
    'hdinsight',
    'cluster',
    'show',
    clName,
    '--osType', 'linux',
    '--json',
  ];

  const output = await runAzureCmd(args);
  return JSON.parse(output.stdout);
}


//
// Get the status of a particular Azure VM.
//
export async function getVmStatus(vmName) {

  assert.isString(vmName);

  const args = [
    'vm',
    'show',
    vmName,
    '--json',
  ];

  const output = await runAzureCmd(args);
  return JSON.parse(output.stdout);
}

//
// Wait until a particular Azure Cluster is running.
// Returns a promise that is resolved when the Cluster is in <state>
//
export function waitClusterState(clOptions, state) {
  console.log('Inside waitClusterState');

  const clName = clOptions.clusterName;
  assert.isString(clName);

  if (verbose) {
    console.log(clName + ': Waiting for Cluster to be ' + state);
  }

  return new Promise((resolve, reject) => {
    const checkClState = () => {

      getClusterStatus(clName)
        .then(status => {
          if (verbose) {
            console.log('>> GotClusterStatus:');
            console.log(status);
          }
          const isRunning = status.state === state;
          const isError = status.state === 'Error';
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
                console.log(clName + ': Cluster not yet ' + state + ', current status: ' + status.state );
              }
              checkClState();
            }
          }
        })
        .catch(err => {
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
export function waitVmRunning(vmName) {

  assert.isString(vmName);

  if (verbose) {
    console.log(vmName + ': Waiting for VM to be running');
  }

  return new Promise((resolve /* , reject */) => {
    const checkVmRunning = () => {
      getVmStatus(vmName)
        .then(status => {
          const isRunning = status.InstanceStatus === 'ReadyRole';
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
        })
        .catch(err => {
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
export function runSshScript(host, user, pass, scriptTemplate, templateView) {

  assert.isString(host);
  assert.isString(user);
  assert.isString(pass);
  assert.isString(scriptTemplate);
  if (templateView) {
    assert.isObject(templateView);
  }

  const sshConfig = {
    host: host,
    username: user,
    password: pass,
  };

  const scriptInstance = Mustache.render(scriptTemplate, templateView);

  const ssh = new SshClient(sshConfig);
  return ssh.exec(scriptInstance);
}

//
// Run a templated shell script on a particular Azure VM via ssh.
//
export function runSshScriptFile(host, user, pass, scriptFilePath, templateView) {

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

  const scriptTemplate = fs.readFileSync(scriptFilePath).toString();
  return runSshScript(host, user, pass, scriptTemplate, templateView);
}

//
// Run a single or set of provisioning scripts on the VM.
//
export function runProvisioningScripts(host, user, pass, provisionScript, templateView) {

  assert.isString(host);
  assert.isString(user);
  assert.isString(pass);
  if (templateView) {
    assert.isObject(templateView);
  }

  if (util.isArray(provisionScript)) {
    return linq.from(provisionScript)
      .aggregate(
        Promise.resolve(),
        (previousPromise, script) => {
          return previousPromise.then(() => {
            return runSshScriptFile(host, user, pass, script, templateView);
          });
        }
      );
  }
  assert.isString(provisionScript);
  return runSshScriptFile(host, user, pass, provisionScript, templateView);
}

//
// Create a VM, wait until it is ready to go, then run 1 or more provisioning scripts via ssh.
//
export function provisionVM(vm) {

  assert.isObject(vm);
  assert.isString(vm.name);
  if (vm.provisioningTemplateView) {
    assert.isObject(vm.provisioningTemplateView);
  }

  return createVM(vm)
    .then(() => {
      return waitVmRunning(vm.name);
    })
    .then(() => {
      if (vm.provisionScript) {
        const hostName = (vm.dnsName || vm.name) + '.cloudapp.net';
        return runProvisioningScripts(hostName, vm.user, vm.pass, vm.provisionScript, vm.provisioningTemplateView);
      }
    });
}
