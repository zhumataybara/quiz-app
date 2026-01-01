async function testUpdate() {
    try {
        console.log('Testing update...');
        const response = await fetch('http://localhost:3001/api/games/cmjqzzjms005r132ukdq5mxek', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: "Updated via Test Script Node",
                rounds: []
            })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Data:', data);
    } catch (err) {
        console.error('Error:', err);
    }
}

testUpdate();
