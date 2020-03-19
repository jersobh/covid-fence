const WebSocket = require('ws');
const Geo = require('geo-nearby');
const g = require('ngeohash');
const wss = new WebSocket.Server({ port: 9000 });

var clients = [];

wss.on('connection', function connection(ws) {
  console.log('client connected')

  ws.on('message', function incoming(msg) {
    data = JSON.parse(msg)

    if (data.type == 'get_clients') {
      ws.id = data.id
      let flag = false;

      clients.forEach(el => {
          if (el.id == data.id) {
              flag = true;
              return false;
          }

        })
        if (!flag) {
          let client = {
            id: data.id,
            lat: data.lat,
            lon: data.lng,
            ws: ws
          }
          clients.push(client)
        }

      const sortedSet = clients.map((r) => Object.assign({}, r, {
          g: g.encode_int(r.lat, r.lon)
      })).sort((a, b) => a.g - b.g);
      let geo = new Geo(sortedSet, { sorted: true });
      let near = geo.nearBy(data.lat, data.lng, 1000)
      ws.send(JSON.stringify({clients: near, type:'near'}));
    }

    if (data.type == 'update_location') {
      if (data.lat && data.lng){
        wss.clients.forEach(function each(client) {
          if (client.id == data.id) {
            client.lat=data.lat
            client.lng=data.lng
           }
        });
      }
   }
  });

  ws.on('close', function(wsID) {
     console.log('connection closed');
     console.log('clients:', clients.length)
     clients = clients.filter(function( obj ) {
        return obj.id !== ws.id;
     });
     console.log('clients:', clients.length)
   })
});
