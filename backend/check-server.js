async function check() {
    try {
        const res5173 = await fetch('http://localhost:5173');
        console.log('5173 Status:', res5173.status);
        console.log('5173 Text preview:', await res5173.text().then(t => t.substring(0, 200)));
    } catch (e) { console.log('5173 Error:', e.message); }

    try {
        const res5174 = await fetch('http://localhost:5174');
        console.log('5174 Status:', res5174.status);
        console.log('5174 Text preview:', await res5174.text().then(t => t.substring(0, 200)));
    } catch (e) { console.log('5174 Error:', e.message); }
}
check();
