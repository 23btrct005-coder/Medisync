const axios = require('axios');
axios.get('https://medisync-backend-api.herokuapp.com/api/v1/appointments/doctors').then(res => console.log(res.data[0])).catch(console.error);
