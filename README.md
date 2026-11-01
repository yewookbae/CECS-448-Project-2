# CECS-448-Project-2
Two-player blackjack game.

## Run the game

Open `index.html` in a browser. In VS Code, right-click the file and choose **Open in Integrated Browser**.

## Changes made to the Game after first iteration

- The game table uses more of the available page width, with the dealer, player hands, and betting controls laid out across the larger felt.
- The center status and final-score text have been removed. Hand totals and win, loss, or push results appear with each hand; the final outcome is also announced to screen readers.
- Each player's wager stays selected after a round and carries into the next round. Use **Clear** to reset it or add chips to change it.

## Changes made to the Game after second iteration

- Both players start with a **$25 default bet**, so the first round can begin without placing chips.
- Hit and Stand controls appear below each player's chips, with that player's keyboard shortcuts shown on the buttons.
- The **Clear** button sits outside the bet amount box, and the displayed bet amount is larger. Double-click the amount to enter a custom bet.
- Push hands stay fully visible. The dealer winner highlight appears only when both players lose.
- A welcome screen explains the game, betting, custom wagers, and each player's controls. Click **Deal cards** or press **Space** to start.
- Keyboard controls: Player One uses **A** to hit and **S** to stand; Player Two uses **;** to hit and **'** to stand. Press **Space** to deal or play again when the main button is enabled.
- The table and controls use a narrower layout on small screens.

