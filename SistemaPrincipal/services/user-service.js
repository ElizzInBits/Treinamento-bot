const { Usuario } = require('../BancoDeDados/models');
const cacheManager = require('../utils/cache-manager');
const { createSharedLogger } = require('../utils/shared-logger');

class UserService {
    constructor() {
        this.logger = createSharedLogger('user-service');
    }

    async findByPhone(telefone, useCache = true) {
        const cacheKey = `user:phone:${telefone}`;
        
        if (useCache) {
            const cached = await cacheManager.get(cacheKey);
            if (cached) {
                this.logger.debug('User found in cache', { telefone });
                return cached;
            }
        }

        const user = await Usuario.findOne({ 
            where: { telefone },
            include: ['empresa']
        });

        if (user && useCache) {
            await cacheManager.set(cacheKey, user.toJSON(), 1800);
        }

        return user;
    }

    async updateUser(id, data) {
        const user = await Usuario.findByPk(id);
        if (!user) throw new Error('User not found');

        await user.update(data);
        
        // Invalidar cache
        await cacheManager.del(`user:id:${id}`);
        await cacheManager.del(`user:phone:${user.telefone}`);
        
        return user;
    }

    async getTrainingStats(empresaId = null) {
        const cacheKey = empresaId ? `stats:company:${empresaId}` : 'stats:global';
        
        const cached = await cacheManager.get(cacheKey);
        if (cached) return cached;

        const whereClause = empresaId ? { empresaId } : {};
        
        const stats = await Usuario.findAll({
            where: whereClause,
            attributes: [
                'statusTreinamento',
                [Usuario.sequelize.fn('COUNT', '*'), 'count']
            ],
            group: ['statusTreinamento'],
            raw: true
        });

        const result = {
            total: stats.reduce((sum, stat) => sum + parseInt(stat.count), 0),
            byStatus: stats.reduce((acc, stat) => {
                acc[stat.statusTreinamento] = parseInt(stat.count);
                return acc;
            }, {})
        };

        await cacheManager.set(cacheKey, result, 300);
        return result;
    }
}

module.exports = new UserService();