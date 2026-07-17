const http = require('http');

http.get('http://localhost:5000/api/chapters/be594e6e-09b5-40a8-b202-ba84f267789b/pages', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response Headers:', res.headers);
    try {
      console.log('Response Body:', JSON.stringify(JSON.parse(data), null, 2));
    } catch (e) {
      console.log('Raw Response Body:', data);
    }
  });
}).on('error', (err) => {
  console.error('Error hitting local server:', err);
});
