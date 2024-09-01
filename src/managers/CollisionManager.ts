// import { Game } from "../game/Game";
// import { GameObject } from "../objects/GameObject";

// export class CollisionManager {
//     constructor(private game: Game) { }

//     checkCollisions(): void {
//         this.checkBulletEnemyCollisions();
//         this.checkPlayerEnemyCollisions();
//         this.checkPlayerPowerupCollisions();
//         if (this.game.boss) {
//             this.checkBossBattleCollisions();
//         }
//     }

//     private checkBulletEnemyCollisions(): void {
//         for (let i = this.game.bullets.length - 1; i >= 0; i--) {
//             for (let j = this.game.enemies.length - 1; j >= 0; j--) {
//                 if (this.checkCollision(this.game.bullets[i], this.game.enemies[j])) {
//                     this.game.bullets.splice(i, 1);
//                     if (this.game.enemies[j].takeDamage()) {
//                         this.game.addExplosion(this.game.enemies[j].getPosition());
//                         this.game.scoreManager.addScore(this.game.enemies[j].getScore());
//                         this.game.enemies.splice(j, 1);
//                     }
//                     break;
//                 }
//             }
//         }
//     }

//     private checkPlayerEnemyCollisions(): void {
//         for (let i = this.game.enemies.length - 1; i >= 0; i--) {
//             if (this.checkCollision(this.game.player, this.game.enemies[i])) {
//                 this.game.player.takeDamage(20);
//                 this.game.addExplosion(this.game.enemies[i].getPosition());
//                 this.game.enemies.splice(i, 1);
//             }
//         }
//     }

//     private checkPlayerPowerupCollisions(): void {
//         for (let i = this.game.powerups.length - 1; i >= 0; i--) {
//             if (this.checkCollision(this.game.player, this.game.powerups[i])) {
//                 this.game.player.activatePowerup(this.game.powerups[i].getType());
//                 this.game.powerups.splice(i, 1);
//             }
//         }
//     }

//     private checkBossBattleCollisions(): void {
//         if (this.game.boss && this.checkCollision(this.game.player, this.game.boss)) {
//             this.game.player.takeDamage(20);
//         }

//         for (let i = this.game.bullets.length - 1; i >= 0; i--) {
//             if (this.game.boss && this.checkCollision(this.game.bullets[i], this.game.boss)) {
//                 this.game.bullets.splice(i, 1);
//                 if (this.game.boss.takeDamage()) {
//                     this.game.addExplosion(this.game.boss.getPosition());
//                     this.game.boss = null;
//                     this.game.handleBossDefeat();
//                 }
//             }
//         }

//         for (let i = this.game.bossBullets.length - 1; i >= 0; i--) {
//             if (this.checkCollision(this.game.player, this.game.bossBullets[i])) {
//                 this.game.player.takeDamage(20);
//                 this.game.bossBullets.splice(i, 1);
//             }
//         }
//     }

//     private checkCollision(obj1: GameObject, obj2: GameObject): boolean {
//         return obj1.getX() < obj2.getX() + obj2.getWidth() &&
//             obj1.getX() + obj1.getWidth() > obj2.getX() &&
//             obj1.getY() < obj2.getY() + obj2.getHeight() &&
//             obj1.getY() + obj1.getHeight() > obj2.getY();
//     }
// }
