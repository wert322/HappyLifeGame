# HappyLifeGame
Cooperative project between Jonathan and Brandon.

This project is still in development but is currently up on https://www.happylifegame.app/.

## Description 
Multiplayer, turn-based tabletop game based on the fictional "Happy Life Game" from the Kaguya-sama: Love is War anime/manga series. This is our attempt at bringing it to life in a playable format that can be enjoyed with friends. Creative liberties are taken with card and game design due to insufficient canon information existing.

## Motivation
This project is an attempt by us to use what we've learned in a more real-world application. A lot of knowledge was picked up during the course of programming this and we're always learning more in an effort to improve and streamline this game.

## Prerequisites
* Express
* pg
* phaser 
* socket.io
* Node.js
* HTML, CSS, Javascript, SQL

## Tech Used
Built using
* Socket.io
* Phaser.js
* Express
* pg (PostgreSQL)
* Node.js
* Heroku web app environment

## Features
Includes dynamically updating lobbies on the lobby page. As lobbies are created, the page will update automatically and show all available lobbies, along with a current player count. Players can choose to create their own lobby or join an existing one. When lobbies empty out, they are deleted and no longer appear on the list. This is automatically updated as well. A backend PostgreSQL database holds important user information and card information, and user information is automatically cleared when their game ends or when they choose to exit the game via any means.

## Contribute
We are not seeking contributions as this project is intended to be a static showcase of our current abilities. However, if there are bugs or other significant issues, we are welcome to notifications or suggestions about them.

## License
MIT © Brandon M. & Jonathan Z.
