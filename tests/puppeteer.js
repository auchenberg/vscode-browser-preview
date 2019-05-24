const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');

  const client = await page.target().createCDPSession();
  const nodeInfo = await client.send('DOM.getNodeForLocation', {
    x: 300,
    y: 100
  });

  const nodeDetails = await client.send('DOM.resolveNode', {
    nodeId: nodeInfo.nodeId,
    backendNodeId: nodeInfo.backendNodeId
  });

  if (nodeDetails.object) {
    let objectId = nodeDetails.object.objectId;
    let nodeProperties = await resolveElementProperties(client, objectId, 3);

    console.log('nodeProperties', nodeProperties);
  }
  await browser.close();
})();

async function resolveElementProperties(client, objectId, maxDepth) {
  let initialProperties = await getProperties(client, objectId);

  let resolve = async (props, passedDepth) => {
    let resolveResult = {};
    let internalCurentDepth = passedDepth | 0;

    for (const item of props) {
      let properties = null;
      if (item.value) {
        if (item.value.type == 'object') {
          if (item.value.objectId) {
            if (internalCurentDepth < maxDepth) {
              properties = await getProperties(client, item.value.objectId);
              if (Array.isArray(properties)) {
                let newDepth = internalCurentDepth + 1;
                properties = await resolve(properties, newDepth);
              }
            } else {
              properties = '<max depth reached>';
            }
          } else if (item.value.value) {
            properties = item.value.value;
          }
        } else if (item.value.type == 'function') {
          properties = 'function';
        } else if (item.value.type == 'string') {
          properties = item.value.value;
        } else if (item.value.type == 'number') {
          properties = item.value.value;
        }
      }

      Object.defineProperty(resolveResult, item.name, {
        value: properties,
        description: item.description,
        enumerable: item.enumerable,
        configurable: item.configurable,
        writable: item.writable
      });
    }
    return resolveResult;
  };

  let result = await resolve(initialProperties);

  return result;
}

async function getProperties(client, objectId) {
  const data = await client.send('Runtime.getProperties', {
    objectId: objectId,
    ownProperties: true
  });

  // console.log('getProperties.data', data);

  return data.result;
}
