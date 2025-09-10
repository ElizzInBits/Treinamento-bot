class PerformanceUtils {
    static cache = new Map();
    static cacheStats = { hits: 0, misses: 0 };

    static memoize(fn, ttl = 300000) {
        return function(...args) {
            const key = JSON.stringify(args);
            const cached = PerformanceUtils.cache.get(key);
            
            if (cached && Date.now() - cached.timestamp < ttl) {
                PerformanceUtils.cacheStats.hits++;
                return cached.value;
            }
            
            PerformanceUtils.cacheStats.misses++;
            const result = fn.apply(this, args);
            PerformanceUtils.cache.set(key, { value: result, timestamp: Date.now() });
            return result;
        };
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static clearCache() {
        PerformanceUtils.cache.clear();
        PerformanceUtils.cacheStats = { hits: 0, misses: 0 };
    }

    static getCacheStats() {
        return {
            ...PerformanceUtils.cacheStats,
            size: PerformanceUtils.cache.size,
            hitRate: PerformanceUtils.cacheStats.hits / (PerformanceUtils.cacheStats.hits + PerformanceUtils.cacheStats.misses) || 0
        };
    }
}

module.exports = PerformanceUtils;