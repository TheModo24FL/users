// Add your JavaScript code here
// document.addEventListener('DOMContentLoaded', function () {
//     console.log('JavaScript is loaded');
// });

const bcrypt = require('bcrypt')

const hashPassword = (password) => {
    return new Promise((resolve, reject) => {
        bcrypt.genSalt(10, (err, salt) => {
            if(err) {
                reject(err)
            }
            bcrypt.hash(password, salt, (err, hash) => {
                if (err){
                    reject(err)
                }
                resolve(hash)
            })
        })
    })
}

const comparePasswords = (password, hashedPassword) => {
    return bcrypt.compare(password, hashedPassword)
}

module.exports = {
    hashPassword,
    comparePasswords
}