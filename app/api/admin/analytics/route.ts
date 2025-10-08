import { NextResponse } from 'next/server';
import { AnalyticsLogger } from '../../../../lib/ai/analytics-logger';
import { SemanticSearchService } from '../../../../lib/ai/semantic-search';
import { HybridMatchingService } from '../../../../lib/ai/hybrid-matcher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'stats';

    const analytics = AnalyticsLogger.getInstance();

    switch (action) {
      case 'stats':
        return getStats(analytics);

      case 'recent':
        return getRecentLogs(analytics, url.searchParams);

      case 'export':
        return exportAnalytics(analytics);

      case 'cache':
        return getCacheStats();

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

async function getStats(analytics: AnalyticsLogger) {
  const performanceStats = analytics.getPerformanceStats();
  const semanticService = SemanticSearchService.getInstance();
  const cacheStats = semanticService.getCacheStats();

  return NextResponse.json({
    timestamp: Date.now(),
    performance: performanceStats,
    cache: cacheStats,
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.round(process.uptime()),
      memoryUsage: process.memoryUsage()
    }
  });
}

async function getRecentLogs(analytics: AnalyticsLogger, params: URLSearchParams) {
  const count = parseInt(params.get('count') || '10', 10);
  const recentLogs = analytics.getRecentAnalytics(Math.min(count, 50)); // Limit to 50

  return NextResponse.json({
    timestamp: Date.now(),
    count: recentLogs.length,
    logs: recentLogs
  });
}

async function exportAnalytics(analytics: AnalyticsLogger) {
  const exportData = analytics.exportAnalytics();

  return NextResponse.json(exportData, {
    headers: {
      'Content-Disposition': `attachment; filename="analytics-${Date.now()}.json"`,
      'Content-Type': 'application/json'
    }
  });
}

async function getCacheStats() {
  try {
    const semanticService = SemanticSearchService.getInstance();
    await semanticService.loadCache(); // Ensure cache is loaded
    const cacheStats = semanticService.getCacheStats();

    return NextResponse.json({
      timestamp: Date.now(),
      cache: cacheStats,
      status: cacheStats ? 'loaded' : 'not_loaded'
    });

  } catch (error) {
    return NextResponse.json({
      timestamp: Date.now(),
      cache: null,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}