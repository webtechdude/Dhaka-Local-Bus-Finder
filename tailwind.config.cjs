module.exports = {
    darkMode: 'class',
    content: [
        './index.html',
        './contact.html',
        './privacy.html',
        './src/**/*.{html,js,css}',  // 👈 include .css for input.css
        './public/**/*.{html,js}'
    ],

    theme: {
        extend: {},
    },
    plugins: [],
}
