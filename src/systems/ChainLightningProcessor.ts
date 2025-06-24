/**
 * 連鎖効果処理システム - Phase 2: 高度な連鎖効果実装
 *
 * SpatialHash最適化、高度な対象選択、視覚効果を含む連鎖ダメージ処理システム
 */

import { Enemy } from '../entities/Enemy';
import { EventEmitter } from '../events/EventEmitter';
import { EventMap } from '../events/EventType';
import { GameObjectManager } from '../managers/GameObjectManager';
import { Vector2D } from '../types';
import { DamageCalculator } from '../utils/DamageCalculator';
import { SpatialHash } from '../utils/SpatialHash';

export interface ChainLightningConfig {
  chainCount: number;
  chainRange: number;
  baseDamage: number;
  criticalChance: number;
  damageReduction: number;
  visualEffects?: boolean;
  priorityMode?: 'nearest' | 'weakest' | 'strongest' | 'threat';
}

export interface ChainLightningVisualEffect {
  fromPosition: Vector2D;
  toPosition: Vector2D;
  startTime: number;
  duration: number;
  intensity: number;
  chainIndex: number;
}

export interface ChainTarget {
  enemy: Enemy;
  distance: number;
  healthRatio: number;
  threatScore: number;
  priority: number;
}

export class ChainLightningProcessor {
  private spatialHash: SpatialHash;
  private visualEffects: ChainLightningVisualEffect[] = [];
  private debugMode: boolean = false;

  constructor(
    private gameObjectManager: GameObjectManager,
    private eventEmitter: EventEmitter<EventMap>
  ) {
    this.spatialHash = new SpatialHash(64); // 64ピクセルのセルサイズ
  }

  /**
   * 連鎖効果を処理する（最適化版）
   * @param originPosition 連鎖開始位置
   * @param config 連鎖設定
   */
  processChainLightning(
    originPosition: Vector2D,
    config: ChainLightningConfig
  ): void {
    this.executeChainLightning(originPosition, config);
  }

  /**
   * 連鎖効果の実行処理（複雑度を下げるために分離）
   */
  private executeChainLightning(
    originPosition: Vector2D,
    config: ChainLightningConfig
  ): void {
    const startTime = performance.now();

    if (this.debugMode) {
      console.log('🌩️ 連鎖効果開始:', {
        position: originPosition,
        chainCount: config.chainCount,
        range: config.chainRange,
        damage: config.baseDamage,
      });
    }

    const enemies = this.gameObjectManager.getEnemies();
    if (enemies.length === 0) return;

    this.updateSpatialHash(enemies);

    const processedEnemies = new Set<Enemy>();
    const chainResults = this.processChainTargets(
      originPosition,
      config,
      enemies,
      processedEnemies
    );

    this.logChainResults(startTime, chainResults);
  }

  /**
   * 連鎖対象の処理
   */
  private processChainTargets(
    originPosition: Vector2D,
    config: ChainLightningConfig,
    enemies: Enemy[],
    processedEnemies: Set<Enemy>
  ): Array<{
    target: Enemy;
    damage: number;
    isCritical: boolean;
    chainIndex: number;
  }> {
    const chainResults: Array<{
      target: Enemy;
      damage: number;
      isCritical: boolean;
      chainIndex: number;
    }> = [];

    let currentTargets = this.findOptimalTargets(
      originPosition,
      enemies,
      config.chainRange,
      config.priorityMode ?? 'nearest',
      1
    );

    let remainingChains = config.chainCount;
    let currentDamage = config.baseDamage;
    let chainIndex = 0;

    while (remainingChains > 0 && currentTargets.length > 0) {
      const nextTargets = this.processCurrentTargets(
        currentTargets,
        processedEnemies,
        currentDamage,
        config,
        chainIndex,
        chainResults,
        enemies
      );

      currentTargets = nextTargets;
      remainingChains--;
      chainIndex++;
      currentDamage *= config.damageReduction;
    }

    return chainResults;
  }

  /**
   * 現在の対象を処理
   */
  private processCurrentTargets(
    currentTargets: Enemy[],
    processedEnemies: Set<Enemy>,
    currentDamage: number,
    config: ChainLightningConfig,
    chainIndex: number,
    chainResults: Array<{
      target: Enemy;
      damage: number;
      isCritical: boolean;
      chainIndex: number;
    }>,
    enemies: Enemy[]
  ): Enemy[] {
    const nextTargets: Enemy[] = [];

    for (const target of currentTargets) {
      if (processedEnemies.has(target)) continue;

      processedEnemies.add(target);

      const damageResult = DamageCalculator.calculateDamage(
        currentDamage,
        config.criticalChance
      );

      this.handleVisualEffects(config, chainIndex, chainResults, target);

      const isDestroyed = target.takeDamage(
        damageResult.damage,
        damageResult.isCritical
      );

      chainResults.push({
        target,
        damage: damageResult.damage,
        isCritical: damageResult.isCritical,
        chainIndex,
      });

      if (isDestroyed) {
        this.eventEmitter.emit('enemyDestroyed', target);
        this.gameObjectManager.removeEnemy(target);
      }

      const nextTarget = this.findNextChainTarget(
        target,
        enemies,
        processedEnemies,
        config
      );

      if (nextTarget) {
        nextTargets.push(nextTarget);
      }
    }

    return nextTargets;
  }

  /**
   * 視覚効果の処理
   */
  private handleVisualEffects(
    config: ChainLightningConfig,
    chainIndex: number,
    chainResults: Array<{
      target: Enemy;
      damage: number;
      isCritical: boolean;
      chainIndex: number;
    }>,
    target: Enemy
  ): void {
    if (config.visualEffects !== false) {
      const fromPos =
        chainIndex === 0
          ? { x: 0, y: 0 }
          : (chainResults[chainResults.length - 1]?.target.getPosition() ?? {
              x: 0,
              y: 0,
            });

      this.addVisualEffect({
        fromPosition: fromPos,
        toPosition: target.getPosition(),
        startTime: performance.now(),
        duration: 300 + chainIndex * 50,
        intensity: 1.0 - chainIndex * 0.1,
        chainIndex,
      });
    }
  }

  /**
   * 次の連鎖対象を探す
   */
  private findNextChainTarget(
    currentTarget: Enemy,
    enemies: Enemy[],
    processedEnemies: Set<Enemy>,
    config: ChainLightningConfig
  ): Enemy | null {
    const availableEnemies = enemies.filter(
      e => !processedEnemies.has(e) && e !== currentTarget
    );

    if (availableEnemies.length > 0) {
      const nextOptimalTargets = this.findOptimalTargets(
        currentTarget.getPosition(),
        availableEnemies,
        config.chainRange,
        config.priorityMode ?? 'nearest',
        1
      );

      return nextOptimalTargets.length > 0 ? nextOptimalTargets[0] : null;
    }

    return null;
  }

  /**
   * 連鎖結果のログ出力
   */
  private logChainResults(
    startTime: number,
    chainResults: Array<{
      target: Enemy;
      damage: number;
      isCritical: boolean;
      chainIndex: number;
    }>
  ): void {
    const endTime = performance.now();

    if (this.debugMode) {
      console.log('⚡ 連鎖効果完了:', {
        処理時間: `${(endTime - startTime).toFixed(2)}ms`,
        連鎖数: chainResults.length,
        総ダメージ: chainResults.reduce((sum, r) => sum + r.damage, 0),
        クリティカル数: chainResults.filter(r => r.isCritical).length,
      });
    }
  }

  /**
   * SpatialHashを更新
   */
  private updateSpatialHash(enemies: Enemy[]): void {
    this.spatialHash.clear();
    enemies.forEach(enemy => {
      this.spatialHash.insert(enemy);
    });
  }

  /**
   * 最適な連鎖対象を選択する高度なアルゴリズム
   */
  private findOptimalTargets(
    position: Vector2D,
    enemies: Enemy[],
    maxRange: number,
    priorityMode: string,
    maxTargets: number = 1
  ): Enemy[] {
    // SpatialHashを使用して範囲内の敵を効率的に取得
    const nearbyEnemies = this.spatialHash.getInRegion({
      x: position.x - maxRange,
      y: position.y - maxRange,
      width: maxRange * 2,
      height: maxRange * 2,
    });

    // 実際の距離でフィルタリング
    const candidateTargets: ChainTarget[] = [];

    for (const enemy of nearbyEnemies) {
      if (enemies.includes(enemy as Enemy)) {
        const enemyPos = (enemy as Enemy).getPosition();
        const distance = this.calculateDistance(position, enemyPos);

        if (distance <= maxRange) {
          const healthRatio = this.getEnemyHealthRatio(enemy as Enemy);
          const threatScore = this.calculateThreatScore(
            enemy as Enemy,
            distance
          );

          candidateTargets.push({
            enemy: enemy as Enemy,
            distance,
            healthRatio,
            threatScore,
            priority: this.calculatePriority(
              distance,
              healthRatio,
              threatScore,
              priorityMode
            ),
          });
        }
      }
    }

    // 優先度でソートして上位を返す
    return candidateTargets
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxTargets)
      .map(target => target.enemy);
  }

  /**
   * 距離を計算
   */
  private calculateDistance(pos1: Vector2D, pos2: Vector2D): number {
    return Math.sqrt(
      Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2)
    );
  }

  /**
   * 敵の体力比率を取得
   */
  private getEnemyHealthRatio(enemy: Enemy): number {
    // Enemyクラスには体力情報のpublicメソッドがないため、
    // 敵のタイプに基づいて推定値を返す
    const enemyType = enemy.getEnemyType();
    switch (enemyType) {
      case 'SMALL':
        return 0.3; // 小型敵は体力が少ない
      case 'MEDIUM':
        return 0.5; // 中型敵は中程度
      case 'LARGE':
        return 0.8; // 大型敵は体力が多い
      default:
        return 0.5;
    }
  }

  /**
   * 脅威度スコアを計算
   */
  private calculateThreatScore(enemy: Enemy, distance: number): number {
    let score = 0;

    // 距離による脅威度（近いほど高い）
    score += (100 - distance) / 100;

    // 敵のタイプによる脅威度
    const enemyType = enemy.getEnemyType?.();
    switch (enemyType) {
      case 'LARGE':
        score += 0.8;
        break;
      case 'MEDIUM':
        score += 0.5;
        break;
      case 'SMALL':
        score += 0.2;
        break;
      default:
        score += 0.3;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * 優先度を計算
   */
  private calculatePriority(
    distance: number,
    healthRatio: number,
    threatScore: number,
    priorityMode: string
  ): number {
    switch (priorityMode) {
      case 'nearest':
        return 1000 - distance; // 近いほど高優先度

      case 'weakest':
        return (1 - healthRatio) * 1000; // 体力が少ないほど高優先度

      case 'strongest':
        return healthRatio * 1000; // 体力が多いほど高優先度

      case 'threat':
        return threatScore * 1000; // 脅威度が高いほど高優先度

      default:
        // バランス型：距離、体力、脅威度を総合評価
        return (
          (1000 - distance) * 0.4 + (1 - healthRatio) * 300 + threatScore * 300
        );
    }
  }

  /**
   * 視覚効果を追加
   */
  private addVisualEffect(effect: ChainLightningVisualEffect): void {
    this.visualEffects.push(effect);

    // 古い効果を削除（メモリリーク防止）
    const currentTime = performance.now();
    this.visualEffects = this.visualEffects.filter(
      e => currentTime - e.startTime < e.duration + 1000
    );
  }

  /**
   * 視覚効果を描画
   */
  public renderVisualEffects(ctx: CanvasRenderingContext2D): void {
    const currentTime = performance.now();

    this.visualEffects.forEach(effect => {
      const elapsed = currentTime - effect.startTime;
      if (elapsed < effect.duration) {
        this.drawLightningEffect(ctx, effect, elapsed / effect.duration);
      }
    });

    // 期限切れの効果を削除
    this.visualEffects = this.visualEffects.filter(
      effect => currentTime - effect.startTime < effect.duration
    );
  }

  /**
   * 稲妻エフェクトを描画
   */
  private drawLightningEffect(
    ctx: CanvasRenderingContext2D,
    effect: ChainLightningVisualEffect,
    progress: number
  ): void {
    const { fromPosition, toPosition, intensity, chainIndex } = effect;

    // アルファ値の計算（フェードアウト）
    const alpha = intensity * (1 - progress) * 0.8;

    // 連鎖インデックスに基づく色の変化
    const hue = 200 + chainIndex * 30; // 青から紫へ
    const color = `hsla(${hue}, 100%, 70%, ${alpha})`;

    ctx.save();

    // メインの稲妻
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 + intensity * 2;
    ctx.lineCap = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    this.drawJaggedLine(ctx, fromPosition, toPosition, 5 + chainIndex * 2);

    // 内側の明るいライン
    ctx.strokeStyle = `hsla(${hue}, 100%, 90%, ${alpha * 1.5})`;
    ctx.lineWidth = 1;
    ctx.shadowBlur = 5;

    this.drawJaggedLine(ctx, fromPosition, toPosition, 3 + chainIndex);

    ctx.restore();
  }

  /**
   * ギザギザした稲妻ラインを描画
   */
  private drawJaggedLine(
    ctx: CanvasRenderingContext2D,
    from: Vector2D,
    to: Vector2D,
    segments: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);

    const dx = to.x - from.x;
    const dy = to.y - from.y;

    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const x = from.x + dx * t + (Math.random() - 0.5) * 20;
      const y = from.y + dy * t + (Math.random() - 0.5) * 20;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  /**
   * デバッグモードの切り替え
   */
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * 視覚効果をクリア
   */
  public clearVisualEffects(): void {
    this.visualEffects = [];
  }

  /**
   * パフォーマンス統計を取得
   */
  public getPerformanceStats(): {
    activeEffects: number;
    spatialHashCells: number;
  } {
    return {
      activeEffects: this.visualEffects.length,
      spatialHashCells: this.spatialHash.getDebugInfo().cellCount,
    };
  }
}
