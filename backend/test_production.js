import https from 'https';

const postJson = (url, body) => {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({ status: res.statusCode, body: data });
        });
      }
    );
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
};

const getAuth = (url, token, headers = {}) => {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          ...headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({ status: res.statusCode, body: data });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
};

const run = async () => {
  try {
    console.log('Logging in to production backend...');
    const loginRes = await postJson('https://cedecco-backend.onrender.com/api/auth/login', {
      email: 'admin@cedecco.com',
      password: 'admin123'
    });
    console.log(`Login response: status=${loginRes.status}, body=${loginRes.body}`);

    if (loginRes.status !== 200) {
      console.error('Login failed in production!');
      return;
    }

    const { token } = JSON.parse(loginRes.body);

    console.log('\nFetching /api/devices from production...');
    const devicesRes = await getAuth('https://cedecco-backend.onrender.com/api/devices', token, {
      'x-device-mac': '00:e0:bf:8c:81:c4'
    });
    console.log(`Devices response: status=${devicesRes.status}, body=${devicesRes.body}`);

    console.log('\nFetching /api/devices/license-status from production...');
    const licenseRes = await getAuth('https://cedecco-backend.onrender.com/api/devices/license-status', token, {
      'x-device-mac': '00:e0:bf:8c:81:c4'
    });
    console.log(`License response: status=${licenseRes.status}, body=${licenseRes.body}`);

  } catch (err) {
    console.error(err);
  }
};

run();
