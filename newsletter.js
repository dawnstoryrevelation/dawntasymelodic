var x = document.getElementById('submit')
var email = document.getElementById('email')
x.addEventListener('click', () => {
    var data = {content: email.value}
    fetch('https://discord.com/api/webhooks/1256549802934669323/WarY7YcYqG5MK9F_PA1FU6ZYz_P1VEsuPKtRpLYxXXiQLaLQOXyRbZ-8IUWT6Zb43Pse', {
     method: "POST", // *GET, POST, PUT, DELETE, etc.
     headers: {
       "Content-Type": "application/json",
       // 'Content-Type': 'application/x-www-form-urlencoded',
     },
     body: JSON.stringify(data), // body data type must match "Content-Type" header
   }).then(() => {
      console.log('sent')
   })
})
