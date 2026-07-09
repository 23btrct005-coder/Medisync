import axios from 'axios';
const test = async () => {
    try {
        const res = await axios.post('http://localhost:8080/api/auth/doctor/login', { email: 'abhidoc@example.com', password: 'password123' });
        const chatRes = await axios.get('http://localhost:8080/api/chat/unread-counts', { headers: { Authorization: `Bearer ${res.data.token}` } });
        console.log(chatRes.data);
    } catch(e) { console.error(e.message); }
};
test();
