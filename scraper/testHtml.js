const axios = require('axios');
const fs = require('fs');

async function inspectHtml() {
    try {
        const response = await axios.get('https://taiwanbible.com/m/bible/bs.jsp?book=1&chapter=1');
        fs.writeFileSync('test.html', response.data);
        console.log("HTML saved to test.html");
    } catch (e) {
        console.error(e.message);
    }
}
inspectHtml();
