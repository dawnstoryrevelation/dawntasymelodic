var form = document.getElementById('form')
var username = document.getElementById('username')
var email = document.getElementById('email')
var password = document.getElementById('password')



form.addEventListener('submit', (e) => {
  e.preventDefault()
  const data = {
    username: username.value,
    email: email.value, 
    password: password.value
  };

  fetch('https://imported-clear-tugboat.glitch.me/signup', {
    method: 'POST', // or 'GET'
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: JSON.stringify(data) // send data in JSON format
  })
  .then(response => response.json())
  .then(data => {
    console.log('Success:', data);
    document.getElementById('response').innerText = `Server Response: ${JSON.stringify(data)}`;
  })
  .catch((error) => {
    console.error('Error:', error);
  });
})
