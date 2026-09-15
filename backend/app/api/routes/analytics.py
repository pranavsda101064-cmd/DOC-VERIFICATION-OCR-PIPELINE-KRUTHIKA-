from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from app.core.database import get_db
from app.models.analysis_result import AnalysisResult
from app.models.finding import Finding

router = APIRouter()


@router.get("/analytics")
async def get_analytics(db: AsyncSession = Depends(get_db)):
    # Aggregate stats
    stmt = select(
        func.count().label("total"),
        func.sum(case((AnalysisResult.risk_label == "LOW", 1), else_=0)).label("low"),
        func.sum(case((AnalysisResult.risk_label == "MEDIUM", 1), else_=0)).label("medium"),
        func.sum(case((AnalysisResult.risk_label == "HIGH", 1), else_=0)).label("high"),
        func.avg(AnalysisResult.risk_score).label("avg_score"),
    ).where(AnalysisResult.status == "complete")

    result = await db.execute(stmt)
    row = result.first()

    total = row.total or 0
    low = row.low or 0
    medium = row.medium or 0
    high = row.high or 0
    avg_score = round(float(row.avg_score or 0), 1)

    def pct(n): return round((n / total * 100), 1) if total > 0 else 0

    # Recent 30 documents trend
    trend_stmt = (
        select(AnalysisResult.created_at, AnalysisResult.risk_score, AnalysisResult.risk_label)
        .where(AnalysisResult.status == "complete")
        .order_by(AnalysisResult.created_at.desc())
        .limit(30)
    )
    trend_res = await db.execute(trend_stmt)
    trend = [
        {"date": r.created_at.strftime("%Y-%m-%d") if r.created_at else "",
         "risk_score": r.risk_score, "risk_label": r.risk_label}
        for r in trend_res.all()
    ]

    # Real anomaly breakdown — count findings by source
    finding_stmt = (
        select(Finding.source, func.count().label("count"))
        .join(AnalysisResult, Finding.analysis_id == AnalysisResult.id)
        .where(AnalysisResult.status == "complete")
        .group_by(Finding.source)
    )
    finding_res = await db.execute(finding_stmt)
    source_counts = {row.source: row.count for row in finding_res.all()}

    # Map backend source names to display labels
    source_label_map = {
        "tamper_detector": "visual_splice_ela",
        "preprocessor": "image_quality",
        "pattern_validator": "pattern_violation",
        "consistency_checker": "qr_inconsistency",
        "layout_analyzer": "template_mismatch",
        "ocr_engine": "ocr_anomaly",
        "metadata_extractor": "metadata_issue",
        "anomaly_detector": "ml_anomaly",
    }
    anomaly_breakdown = {}
    for source, count in source_counts.items():
        label = source_label_map.get(source, source)
        anomaly_breakdown[label] = count

    return {
        "total_documents": total,
        "low_risk_count": low,
        "medium_risk_count": medium,
        "high_risk_count": high,
        "low_risk_pct": pct(low),
        "medium_risk_pct": pct(medium),
        "high_risk_pct": pct(high),
        "average_risk_score": avg_score,
        "anomaly_breakdown": anomaly_breakdown,
        "recent_trend": trend,
    }
