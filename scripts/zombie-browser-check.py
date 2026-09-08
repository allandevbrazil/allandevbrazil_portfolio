# Run against the local game tab: Get-Content scripts/zombie-browser-check.py | browser-harness
# Requires the game menu/assets to have been loaded. No remote services are used.
print(js(r"""(async () => {
    const a = window.application, g = window.golZombie.game
    const results = []
    function check(condition, label, details) {
        if (!condition) throw new Error(label + ': ' + JSON.stringify(details))
        results.push({ test: label, ...details })
    }
    await g.startGame()
    g.timer.stop()
    await new Promise(resolve => setTimeout(resolve, 450))
    check(a.$canvas.getBoundingClientRect().x === 0, 'canvas centered', {})
    check(g.zombies.count >= 48 && g.monsters.count === 6, 'initial population', { zombies: g.zombies.count, monsters: g.monsters.count })
    const leg = g.zombies.active[0].limbs[2], rotation = leg.rotation.x
    const mixer = g.monsters.items[0].mixer, beforeTime = mixer.time
    await new Promise(resolve => setTimeout(resolve, 160))
    check(rotation !== leg.rotation.x && mixer.time > beforeTime, 'live animations', { leg: leg.rotation.x, mixer: mixer.time })

    a.time.stop()
    try {
        const body = a.world.physics.car.chassis.body, car = a.world.car.chassis.object.position
        let now = performance.now()
        g._nextHordeAt = now + 10000
        g.powerups.clear(); g.health.reset()
        const zombie = g.zombies.active[0]
        zombie.mesh.position.copy(car); zombie.mesh.position.x += 0.5
        zombie.offset = { x: 0, y: 0 }; zombie.nextAttack = 0
        a.world.physics.car.forwardSpeed = 0.08
        const score = g.score.total
        body.velocity.set(0, 0, 0)
        g.update(16, now)
        check(zombie.dead && g.score.total > score && g.fx.active.some(p => p.blood), 'run-over score and blood', { score: g.score.total, particles: g.fx.active.length })
        check(body.velocity.length() > 0 && a.camera.impactShake > 0, 'physical recoil and camera shake', { velocity: body.velocity.length(), shake: a.camera.impactShake })
        check(g.audio.ctx.state === 'running' && Number.isFinite(g.audio.lastImpact), 'impact audio active', { context: g.audio.ctx.state })

        const attacker = g.zombies.active.find(z => !z.dead)
        attacker.mesh.position.copy(car); attacker.mesh.position.y += 0.5
        attacker.nextAttack = 0; attacker.offset = { x: 0, y: 0 }
        a.world.physics.car.forwardSpeed = 0; g.health.lastHitAt = -Infinity
        g.update(16, now + 100)
        check(g.health.value < g.health.max && attacker.attackUntil > now, 'zombie attack animation and damage', { hp: g.health.value })
        g.health.value = 40; g.powerups.apply('ciano', now)
        check(g.health.value === 70, 'healing crystal', { hp: g.health.value })

        const crystal = g.crystals.items.find(item => !item.collected)
        const near = crystal.mesh.position.clone(); near.x += 6
        g.radar.update(near, a.camera.instance, g.crystals, now + 200, 54)
        check(g.radar.rows.crystal.row.classList.contains('near'), 'radar proximity signal', { text: g.radar.rows.crystal.signal.textContent })
        check(!g.radar.rows.emerald.arrow.hidden, 'emerald direction always present', {})
        for (const item of g.crystals.items.slice(0, 10)) item.collected = true
        g.radar.update(car, a.camera.instance, g.crystals, now + 300, 54)
        check(g.radar.rows.crystal.arrow.hidden && !g.radar.rows.emerald.arrow.hidden, 'radar tracks remaining objective', {})

        g.crystals.items.forEach(item => item.collected = false)
        g._nextHordeAt = 0
        const population = g.zombies.count
        g.update(16, now + 500)
        check(g.zombies.count > population, 'horde replenishment', { before: population, after: g.zombies.count })
        const camera = a.camera.instance, saved = camera.position.clone(), player = car.clone().set(12, -56, 0.3)
        camera.position.set(18, -66, 12)
        for (let i = 0; i < 10; i++) g.occlusion.update(100, camera, player)
        check(g.occlusion.items.some(item => item.alpha === 0.12), 'real city walls fade', { faded: g.occlusion.items.filter(item => item.alpha < 1).length })
        camera.position.copy(player).add(car.clone().set(0, 0, 22))
        for (let i = 0; i < 10; i++) g.occlusion.update(100, camera, player)
        check(g.occlusion.items.every(item => item.alpha === 1), 'walls restore opacity', {})
        camera.position.copy(saved)
        check((window.__gameErrors || []).length === 0, 'no runtime errors', { errors: window.__gameErrors })
        return results
    } finally {
        await g.startGame()
        a.time.current = Date.now(); a.time.tick()
    }
})()"""))
