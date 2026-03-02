const axios = require('axios');
const fs = require('fs');

async function inspectHtml() {
    try {
        const response = await axios.get('https://taiwanbible.com/m/bible/bsreadBook.jsp?Book=GEN');
        fs.writeFileSync('test_gen.html', response.data);
        console.log("HTML saved to test_gen.html");
    } catch (e) {
        console.error(e.message);
    }
}
inspectHtml();
