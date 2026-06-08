const axios = require('axios');
const fs = require('fs');

async function testApi() {
  try {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('name', 'Jawaher');
    form.append('category', 'Grocery');
    form.append('buyingPrice', '250');
    form.append('sellingPrice', '300');
    form.append('bulkPrice', '275');
    form.append('stock', '50');
    form.append('barcode', '13221');
    form.append('productType', 'fixed');
    form.append('unit', 'pcs');

    const res = await axios.post('http://localhost:5000/api/products', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: 'Bearer test' // Note: This might fail authMiddleware!
      }
    });
    console.log("SUCCESS:", res.data);
  } catch (err) {
    if (err.response) {
      console.log("ERROR STATUS:", err.response.status);
      console.log("ERROR DATA:", err.response.data);
    } else {
      console.log("ERROR:", err.message);
    }
  }
}

testApi();
