"""
Seed database with realistic mock data on first startup.
Ensures dashboard, analytics, documents, and risk queue always have data.
"""
import uuid
import logging
from datetime import datetime, timedelta
from sqlalchemy import select, func
from app.core.database import AsyncSessionLocal
from app.models.document import Document
from app.models.analysis_result import AnalysisResult
from app.models.finding import Finding
from app.models.ocr_field import OcrField
from app.models.risk_score import RiskScore

logger = logging.getLogger(__name__)

NOW = datetime.utcnow()

MOCK_DOCUMENTS = [
    {
        "doc_id": "mock-auth-001",
        "analysis_id": "ana-auth-001",
        "filename": "authentic_doc.jpg",
        "original_filename": "authentic_aadhaar.jpg",
        "mime_type": "image/jpeg",
        "file_size": 245760,
        "width": 1240,
        "height": 880,
        "days_ago": 6,
        "document_type": "Aadhaar Card",
        "classification_confidence": 0.96,
        "matched_template": "aadhaar_v3",
        "quality_score": 92.0,
        "quality_details": {"blur_score": 94.0, "exposure": 88.0, "resolutionadequacy": 95.0, "skew_angle": 0.3, "noise_level": 8.0},
        "ocr_avg_confidence": 0.93,
        "ocr_status": "complete",
        "template_similarity": 0.95,
        "layout_details": {"shifted_regions": 0, "missing_regions": 0, "extra_regions": 0},
        "tamper_score": 0.05,
        "tamper_details": {"ela_max_delta": 12.0, "noise_inconsistency": 0.03, "edge_discontinuity": 0.04, "suspicious_regions": 0},
        "qr_status": "valid",
        "qr_details": {"qr_detected": True, "payload_fields": 4, "mismatches": 0, "checksum_valid": True},
        "anomaly_score": -0.12,
        "anomaly_label": "NORMAL",
        "risk_score": 12,
        "risk_label": "LOW",
        "metadata_anomaly_score": 0.02,
        "metadata_details": {"software_detected": None, "modification工具": None, "exif_consistent": True},
        "consistency_details": {"field_mismatches": 0, "critical_mismatches": 0},
        "review_status": "approved",
        "findings": [],
        "ocr_fields": [
            {"field_name": "name", "value": "RAJESH KUMAR SINGH", "confidence": 0.97, "bbox": [180, 120, 320, 35]},
            {"field_name": "dob", "value": "15/08/1990", "confidence": 0.95, "bbox": [180, 170, 180, 30]},
            {"field_name": "gender", "value": "MALE", "confidence": 0.98, "bbox": [180, 210, 100, 28]},
            {"field_name": "aadhaar_number", "value": "4521 8832 1094", "confidence": 0.94, "bbox": [180, 260, 260, 32]},
            {"field_name": "address", "value": "123 MG Road, New Delhi 110001", "confidence": 0.91, "bbox": [180, 310, 340, 50]},
            {"field_name": "phone", "value": "9876543210", "confidence": 0.89, "bbox": [180, 380, 160, 28]},
        ],
    },
    {
        "doc_id": "mock-text-002",
        "analysis_id": "ana-text-002",
        "filename": "text_tampered_doc.jpg",
        "original_filename": "text_tampered_aadhaar.jpg",
        "mime_type": "image/jpeg",
        "file_size": 268800,
        "width": 1240,
        "height": 880,
        "days_ago": 5,
        "document_type": "Aadhaar Card",
        "classification_confidence": 0.91,
        "matched_template": "aadhaar_v3",
        "quality_score": 78.0,
        "quality_details": {"blur_score": 82.0, "exposure": 75.0, "resolutionadequacy": 80.0, "skew_angle": 1.2, "noise_level": 18.0},
        "ocr_avg_confidence": 0.72,
        "ocr_status": "complete",
        "template_similarity": 0.82,
        "layout_details": {"shifted_regions": 1, "missing_regions": 0, "extra_regions": 0},
        "tamper_score": 0.68,
        "tamper_details": {"ela_max_delta": 78.0, "noise_inconsistency": 0.62, "edge_discontinuity": 0.55, "suspicious_regions": 2},
        "qr_status": "valid",
        "qr_details": {"qr_detected": True, "payload_fields": 4, "mismatches": 0, "checksum_valid": True},
        "anomaly_score": -0.78,
        "anomaly_label": "ANOMALY_DETECTED",
        "risk_score": 84,
        "risk_label": "HIGH",
        "metadata_anomaly_score": 0.45,
        "metadata_details": {"software_detected": "Adobe Photoshop", "modification工具": "Photoshop CC 2024", "exif_consistent": False},
        "consistency_details": {"field_mismatches": 2, "critical_mismatches": 1},
        "review_status": "flagged",
        "findings": [
            {"source": "tamper_detector", "finding_type": "text_tampering", "severity": "CRITICAL", "score": 0.82, "confidence": 0.91, "description": "Name field shows high ELA variance (78.0) indicating digital text replacement. Original text edges inconsistent with JPEG compression pattern.", "evidence": {"region": "name_field", "ela_delta": 78.0, "noise_sigma": 0.62, "displaced_fields": ["name"]}, "rule_id": "TAMPER-001"},
            {"source": "tamper_detector", "finding_type": "text_tampering", "severity": "HIGH", "score": 0.65, "confidence": 0.85, "description": "Aadhaar number region shows compression artifacts inconsistent with surrounding area, suggesting number modification.", "evidence": {"region": "id_number", "ela_delta": 52.0, "compression_mismatch": True}, "rule_id": "TAMPER-002"},
            {"source": "metadata_extractor", "finding_type": "metadata_anomaly", "severity": "HIGH", "score": 0.45, "confidence": 0.88, "description": "EXIF metadata indicates Adobe Photoshop was used to edit this image. Last modification timestamp is 2 hours before upload.", "evidence": {"software": "Adobe Photoshop", "modify_date": "2026-09-10T14:22:00Z", "exif_consistent": False}, "rule_id": "META-001"},
        ],
        "ocr_fields": [
            {"field_name": "name", "value": "RAJESH KUMAR SHARMA", "confidence": 0.68, "bbox": [180, 120, 330, 35]},
            {"field_name": "dob", "value": "15/08/1990", "confidence": 0.92, "bbox": [180, 170, 180, 30]},
            {"field_name": "gender", "value": "MALE", "confidence": 0.95, "bbox": [180, 210, 100, 28]},
            {"field_name": "aadhaar_number", "value": "4521 8876 5432", "confidence": 0.71, "bbox": [180, 260, 260, 32]},
            {"field_name": "address", "value": "123 MG Road, New Delhi 110001", "confidence": 0.88, "bbox": [180, 310, 340, 50]},
        ],
    },
    {
        "doc_id": "mock-photo-003",
        "analysis_id": "ana-photo-003",
        "filename": "photo_tampered_doc.jpg",
        "original_filename": "photo_tampered_pan.jpg",
        "mime_type": "image/jpeg",
        "file_size": 312000,
        "width": 1240,
        "height": 880,
        "days_ago": 5,
        "document_type": "PAN Card",
        "classification_confidence": 0.89,
        "matched_template": "pan_v2",
        "quality_score": 81.0,
        "quality_details": {"blur_score": 85.0, "exposure": 79.0, "resolutionadequacy": 82.0, "skew_angle": 0.8, "noise_level": 15.0},
        "ocr_avg_confidence": 0.85,
        "ocr_status": "complete",
        "template_similarity": 0.88,
        "layout_details": {"shifted_regions": 0, "missing_regions": 0, "extra_regions": 1},
        "tamper_score": 0.58,
        "tamper_details": {"ela_max_delta": 65.0, "noise_inconsistency": 0.52, "edge_discontinuity": 0.48, "suspicious_regions": 1},
        "qr_status": "valid",
        "qr_details": {"qr_detected": False, "payload_fields": 0, "mismatches": 0, "checksum_valid": False},
        "anomaly_score": -0.65,
        "anomaly_label": "ANOMALY_DETECTED",
        "risk_score": 79,
        "risk_label": "HIGH",
        "metadata_anomaly_score": 0.38,
        "metadata_details": {"software_detected": "GIMP", "modification工具": "GIMP 2.10", "exif_consistent": False},
        "consistency_details": {"field_mismatches": 1, "critical_mismatches": 0},
        "review_status": "flagged",
        "findings": [
            {"source": "tamper_detector", "finding_type": "photo_tampering", "severity": "CRITICAL", "score": 0.75, "confidence": 0.89, "description": "Photo region ELA shows significantly higher error levels (65.0) compared to document background (12.0), indicating face replacement.", "evidence": {"region": "photo", "ela_delta": 65.0, "bg_ela_delta": 12.0, "ratio": 5.4}, "rule_id": "TAMPER-003"},
            {"source": "tamper_detector", "finding_type": "noise_inconsistency", "severity": "HIGH", "score": 0.52, "confidence": 0.82, "description": "Noise pattern in photo region differs from rest of document. Photo shows signs of being sourced from a different camera/sensor.", "evidence": {"photo_noise_sigma": 0.52, "doc_noise_sigma": 0.12, "mismatch_ratio": 4.3}, "rule_id": "TAMPER-004"},
        ],
        "ocr_fields": [
            {"field_name": "name", "value": "PRIYA PATEL", "confidence": 0.90, "bbox": [200, 140, 280, 32]},
            {"field_name": "dob", "value": "22/03/1988", "confidence": 0.93, "bbox": [200, 185, 170, 28]},
            {"field_name": "father_name", "value": "SURESH PATEL", "confidence": 0.87, "bbox": [200, 225, 260, 30]},
            {"field_name": "pan_number", "value": "ABCDE1234F", "confidence": 0.82, "bbox": [200, 270, 200, 32]},
        ],
    },
    {
        "doc_id": "mock-layout-004",
        "analysis_id": "ana-layout-004",
        "filename": "layout_tampered_doc.jpg",
        "original_filename": "layout_tampered_passport.jpg",
        "mime_type": "image/jpeg",
        "file_size": 295000,
        "width": 1240,
        "height": 880,
        "days_ago": 4,
        "document_type": "Passport",
        "classification_confidence": 0.84,
        "matched_template": "passport_v1",
        "quality_score": 74.0,
        "quality_details": {"blur_score": 78.0, "exposure": 72.0, "resolutionadequacy": 76.0, "skew_angle": 2.1, "noise_level": 22.0},
        "ocr_avg_confidence": 0.79,
        "ocr_status": "complete",
        "template_similarity": 0.68,
        "layout_details": {"shifted_regions": 3, "missing_regions": 1, "extra_regions": 0},
        "tamper_score": 0.32,
        "tamper_details": {"ela_max_delta": 35.0, "noise_inconsistency": 0.28, "edge_discontinuity": 0.25, "suspicious_regions": 1},
        "qr_status": "valid",
        "qr_details": {"qr_detected": True, "payload_fields": 3, "mismatches": 1, "checksum_valid": True},
        "anomaly_score": -0.48,
        "anomaly_label": "ANOMALY_DETECTED",
        "risk_score": 58,
        "risk_label": "MEDIUM",
        "metadata_anomaly_score": 0.15,
        "metadata_details": {"software_detected": None, "modification工具": None, "exif_consistent": True},
        "consistency_details": {"field_mismatches": 1, "critical_mismatches": 0},
        "review_status": "pending",
        "findings": [
            {"source": "layout_analyzer", "finding_type": "layout_shift", "severity": "HIGH", "score": 0.68, "confidence": 0.85, "description": "3 text regions shifted from expected template positions. Header text displaced 15px right, photo region shifted 8px down.", "evidence": {"shifted_count": 3, "max_displacement_px": 15, "regions": ["header", "photo", "name"]}, "rule_id": "LAYOUT-001"},
            {"source": "layout_analyzer", "finding_type": "missing_region", "severity": "MEDIUM", "score": 0.45, "confidence": 0.78, "description": "Machine Readable Zone (MRZ) region missing from expected position at bottom of passport page.", "evidence": {"missing_region": "mrz_zone", "expected_position": [50, 780, 1140, 60]}, "rule_id": "LAYOUT-002"},
        ],
        "ocr_fields": [
            {"field_name": "surname", "value": "KUMAR", "confidence": 0.85, "bbox": [220, 160, 160, 30]},
            {"field_name": "given_name", "value": "ANIL", "confidence": 0.88, "bbox": [220, 200, 120, 30]},
            {"field_name": "nationality", "value": "INDIAN", "confidence": 0.92, "bbox": [220, 240, 140, 28]},
            {"field_name": "passport_number", "value": "R1234567", "confidence": 0.81, "bbox": [220, 285, 180, 30]},
            {"field_name": "dob", "value": "10/11/1995", "confidence": 0.86, "bbox": [220, 330, 160, 28]},
        ],
    },
    {
        "doc_id": "mock-qr-005",
        "analysis_id": "ana-qr-005",
        "filename": "qr_mismatch_doc.jpg",
        "original_filename": "qr_mismatch_aadhaar.jpg",
        "mime_type": "image/jpeg",
        "file_size": 278000,
        "width": 1240,
        "height": 880,
        "days_ago": 3,
        "document_type": "Aadhaar Card",
        "classification_confidence": 0.93,
        "matched_template": "aadhaar_v3",
        "quality_score": 86.0,
        "quality_details": {"blur_score": 88.0, "exposure": 84.0, "resolutionadequacy": 87.0, "skew_angle": 0.5, "noise_level": 11.0},
        "ocr_avg_confidence": 0.90,
        "ocr_status": "complete",
        "template_similarity": 0.91,
        "layout_details": {"shifted_regions": 0, "missing_regions": 0, "extra_regions": 0},
        "tamper_score": 0.18,
        "tamper_details": {"ela_max_delta": 22.0, "noise_inconsistency": 0.15, "edge_discontinuity": 0.12, "suspicious_regions": 0},
        "qr_status": "mismatch",
        "qr_details": {"qr_detected": True, "payload_fields": 4, "mismatches": 2, "checksum_valid": True, "mismatched_fields": ["name", "aadhaar_number"]},
        "anomaly_score": -0.62,
        "anomaly_label": "ANOMALY_DETECTED",
        "risk_score": 76,
        "risk_label": "HIGH",
        "metadata_anomaly_score": 0.08,
        "metadata_details": {"software_detected": None, "modification工具": None, "exif_consistent": True},
        "consistency_details": {"field_mismatches": 2, "critical_mismatches": 2},
        "review_status": "flagged",
        "findings": [
            {"source": "qr_analyzer", "finding_type": "qr_mismatch", "severity": "CRITICAL", "score": 0.85, "confidence": 0.93, "description": "QR code decoded name 'VIKRAM REDDY' does not match visible name 'ARJUN MEHTA'. QR appears to belong to a different person.", "evidence": {"qr_name": "VIKRAM REDDY", "visible_name": "ARJUN MEHTA", "mismatch_type": "name_mismatch"}, "rule_id": "QR-001"},
            {"source": "qr_analyzer", "finding_type": "qr_mismatch", "severity": "CRITICAL", "score": 0.82, "confidence": 0.91, "description": "QR Aadhaar number '8765 4321 0987' does not match visible number '4521 8832 1094'. Possible QR code swapped from another document.", "evidence": {"qr_number": "8765 4321 0987", "visible_number": "4521 8832 1094", "mismatch_type": "number_mismatch"}, "rule_id": "QR-002"},
        ],
        "ocr_fields": [
            {"field_name": "name", "value": "ARJUN MEHTA", "confidence": 0.94, "bbox": [180, 120, 280, 35]},
            {"field_name": "dob", "value": "05/12/1992", "confidence": 0.96, "bbox": [180, 170, 170, 30]},
            {"field_name": "gender", "value": "MALE", "confidence": 0.97, "bbox": [180, 210, 100, 28]},
            {"field_name": "aadhaar_number", "value": "4521 8832 1094", "confidence": 0.92, "bbox": [180, 260, 260, 32]},
            {"field_name": "address", "value": "45 Park Lane, Mumbai 400001", "confidence": 0.88, "bbox": [180, 310, 320, 50]},
        ],
    },
    {
        "doc_id": "mock-quality-006",
        "analysis_id": "ana-quality-006",
        "filename": "low_quality_doc.jpg",
        "original_filename": "low_quality_scan.jpg",
        "mime_type": "image/jpeg",
        "file_size": 98000,
        "width": 640,
        "height": 480,
        "days_ago": 3,
        "document_type": "Driving License",
        "classification_confidence": 0.65,
        "matched_template": "dl_v1",
        "quality_score": 35.0,
        "quality_details": {"blur_score": 28.0, "exposure": 42.0, "resolutionadequacy": 30.0, "skew_angle": 4.5, "noise_level": 45.0},
        "ocr_avg_confidence": 0.48,
        "ocr_status": "low_confidence",
        "template_similarity": 0.72,
        "layout_details": {"shifted_regions": 1, "missing_regions": 1, "extra_regions": 0},
        "tamper_score": 0.10,
        "tamper_details": {"ela_max_delta": 15.0, "noise_inconsistency": 0.08, "edge_discontinuity": 0.06, "suspicious_regions": 0},
        "qr_status": "not_detected",
        "qr_details": {"qr_detected": False, "payload_fields": 0, "mismatches": 0, "checksum_valid": False},
        "anomaly_score": -0.32,
        "anomaly_label": "NORMAL",
        "risk_score": 45,
        "risk_label": "MEDIUM",
        "metadata_anomaly_score": 0.05,
        "metadata_details": {"software_detected": None, "modification工具": None, "exif_consistent": True},
        "consistency_details": {"field_mismatches": 0, "critical_mismatches": 0},
        "review_status": "pending",
        "findings": [
            {"source": "preprocessor", "finding_type": "quality_issue", "severity": "MEDIUM", "score": 0.65, "confidence": 0.88, "description": "Image severely blurred (score: 28/100) and low resolution (640x480). Text recognition significantly degraded.", "evidence": {"blur_score": 28.0, "resolution": "640x480", "dpi_estimate": 72}, "rule_id": "QUAL-001"},
        ],
        "ocr_fields": [
            {"field_name": "name", "value": "SURESH", "confidence": 0.42, "bbox": [100, 80, 180, 25]},
            {"field_name": "license_number", "value": "DL-1420110012345", "confidence": 0.38, "bbox": [100, 120, 240, 22]},
        ],
    },
    {
        "doc_id": "mock-incon-007",
        "analysis_id": "ana-incon-007",
        "filename": "inconsistent_doc.jpg",
        "original_filename": "inconsistent_fields.jpg",
        "mime_type": "image/jpeg",
        "file_size": 234000,
        "width": 1240,
        "height": 880,
        "days_ago": 2,
        "document_type": "Aadhaar Card",
        "classification_confidence": 0.88,
        "matched_template": "aadhaar_v3",
        "quality_score": 82.0,
        "quality_details": {"blur_score": 85.0, "exposure": 80.0, "resolutionadequacy": 83.0, "skew_angle": 0.7, "noise_level": 14.0},
        "ocr_avg_confidence": 0.86,
        "ocr_status": "complete",
        "template_similarity": 0.85,
        "layout_details": {"shifted_regions": 1, "missing_regions": 0, "extra_regions": 0},
        "tamper_score": 0.28,
        "tamper_details": {"ela_max_delta": 32.0, "noise_inconsistency": 0.25, "edge_discontinuity": 0.22, "suspicious_regions": 1},
        "qr_status": "valid",
        "qr_details": {"qr_detected": True, "payload_fields": 4, "mismatches": 1, "checksum_valid": True},
        "anomaly_score": -0.55,
        "anomaly_label": "ANOMALY_DETECTED",
        "risk_score": 71,
        "risk_label": "HIGH",
        "metadata_anomaly_score": 0.22,
        "metadata_details": {"software_detected": None, "modification工具": None, "exif_consistent": True},
        "consistency_details": {"field_mismatches": 3, "critical_mismatches": 1},
        "review_status": "flagged",
        "findings": [
            {"source": "consistency_checker", "finding_type": "field_mismatch", "severity": "HIGH", "score": 0.72, "confidence": 0.87, "description": "DOB in OCR text (01/01/1985) does not match DOB in QR payload (15/06/1990). Critical identity field inconsistency.", "evidence": {"field": "dob", "ocr_value": "01/01/1985", "qr_value": "15/06/1990", "mismatch_type": "cross_source"}, "rule_id": "CONSIST-001"},
            {"source": "consistency_checker", "finding_type": "field_mismatch", "severity": "MEDIUM", "score": 0.55, "confidence": 0.80, "description": "Address line contains special characters not typical for official documents. Possible OCR error or manual text injection.", "evidence": {"field": "address", "value": "123 MG Rd!@# New Delhi", "anomaly": "special_characters"}, "rule_id": "CONSIST-002"},
        ],
        "ocr_fields": [
            {"field_name": "name", "value": "MEERA NAIR", "confidence": 0.91, "bbox": [180, 120, 250, 35]},
            {"field_name": "dob", "value": "01/01/1985", "confidence": 0.88, "bbox": [180, 170, 170, 30]},
            {"field_name": "gender", "value": "FEMALE", "confidence": 0.94, "bbox": [180, 210, 120, 28]},
            {"field_name": "aadhaar_number", "value": "3344 5566 7788", "confidence": 0.85, "bbox": [180, 260, 260, 32]},
            {"field_name": "address", "value": "123 MG Rd!@# New Delhi", "confidence": 0.78, "bbox": [180, 310, 300, 50]},
        ],
    },
    {
        "doc_id": "mock-anomaly-008",
        "analysis_id": "ana-anomaly-008",
        "filename": "anomaly_doc.jpg",
        "original_filename": "combined_anomaly.jpg",
        "mime_type": "image/jpeg",
        "file_size": 345000,
        "width": 1240,
        "height": 880,
        "days_ago": 1,
        "document_type": "Aadhaar Card",
        "classification_confidence": 0.87,
        "matched_template": "aadhaar_v3",
        "quality_score": 70.0,
        "quality_details": {"blur_score": 72.0, "exposure": 68.0, "resolutionadequacy": 74.0, "skew_angle": 1.8, "noise_level": 25.0},
        "ocr_avg_confidence": 0.74,
        "ocr_status": "complete",
        "template_similarity": 0.76,
        "layout_details": {"shifted_regions": 2, "missing_regions": 0, "extra_regions": 1},
        "tamper_score": 0.72,
        "tamper_details": {"ela_max_delta": 82.0, "noise_inconsistency": 0.68, "edge_discontinuity": 0.61, "suspicious_regions": 3},
        "qr_status": "mismatch",
        "qr_details": {"qr_detected": True, "payload_fields": 4, "mismatches": 3, "checksum_valid": False, "mismatched_fields": ["name", "dob", "aadhaar_number"]},
        "anomaly_score": -0.85,
        "anomaly_label": "ANOMALY_DETECTED",
        "risk_score": 88,
        "risk_label": "HIGH",
        "metadata_anomaly_score": 0.58,
        "metadata_details": {"software_detected": "Adobe Photoshop", "modification工具": "Photoshop CC 2024", "exif_consistent": False},
        "consistency_details": {"field_mismatches": 3, "critical_mismatches": 2},
        "review_status": "flagged",
        "findings": [
            {"source": "tamper_detector", "finding_type": "ela_anomaly", "severity": "CRITICAL", "score": 0.88, "confidence": 0.92, "description": "Extreme ELA delta (82.0) across multiple regions. Image shows signs of heavy manipulation — at least 3 distinct editing sessions detected.", "evidence": {"ela_max_delta": 82.0, "ela_regions": ["name", "photo", "id_number"], "editing_sessions_estimated": 3}, "rule_id": "TAMPER-005"},
            {"source": "qr_analyzer", "finding_type": "qr_mismatch", "severity": "CRITICAL", "score": 0.85, "confidence": 0.90, "description": "QR code belongs to a completely different document. Name, DOB, and Aadhaar number all mismatch with visible text.", "evidence": {"mismatched_fields": ["name", "dob", "aadhaar_number"], "qr_owner": "UNKNOWN", "visible_owner": "SHWETA GUPTA"}, "rule_id": "QR-003"},
            {"source": "metadata_extractor", "finding_type": "metadata_anomaly", "severity": "HIGH", "score": 0.58, "confidence": 0.85, "description": "EXIF shows Adobe Photoshop usage with 3 separate save timestamps within 30 minutes, indicating iterative manual editing.", "evidence": {"software": "Adobe Photoshop", "save_count": 3, "time_span_minutes": 30, "exif_consistent": False}, "rule_id": "META-002"},
        ],
        "ocr_fields": [
            {"field_name": "name", "value": "SHWETA GUPTA", "confidence": 0.76, "bbox": [180, 120, 270, 35]},
            {"field_name": "dob", "value": "20/07/1988", "confidence": 0.72, "bbox": [180, 170, 170, 30]},
            {"field_name": "gender", "value": "FEMALE", "confidence": 0.90, "bbox": [180, 210, 120, 28]},
            {"field_name": "aadhaar_number", "value": "9988 7766 5544", "confidence": 0.69, "bbox": [180, 260, 260, 32]},
            {"field_name": "address", "value": "78 Civil Lines, Jaipur 302006", "confidence": 0.81, "bbox": [180, 310, 320, 50]},
        ],
    },
]


async def seed_if_empty():
    """Seed database with mock data if empty. Called once at startup."""
    async with AsyncSessionLocal() as db:
        count = await db.scalar(select(func.count(Document.id)))
        if count and count > 0:
            logger.info(f"Database has {count} documents — skipping seed")
            return

        logger.info("Database empty — seeding mock data...")
        try:
            for doc_data in MOCK_DOCUMENTS:
                # Create document
                doc = Document(
                    id=doc_data["doc_id"],
                    filename=doc_data["filename"],
                    original_filename=doc_data["original_filename"],
                    sha256=f"mock_{uuid.uuid4().hex[:16]}",
                    file_size=doc_data["file_size"],
                    mime_type=doc_data["mime_type"],
                    upload_path=f"uploads/{doc_data['filename']}",
                    page_count=1,
                    width=doc_data["width"],
                    height=doc_data["height"],
                    exif_data=None,
                    created_at=NOW - timedelta(days=doc_data["days_ago"]),
                )
                db.add(doc)

                # Create analysis result
                created = NOW - timedelta(days=doc_data["days_ago"])
                completed = created + timedelta(seconds=25)
                analysis = AnalysisResult(
                    id=doc_data["analysis_id"],
                    document_id=doc_data["doc_id"],
                    status="complete",
                    document_type=doc_data["document_type"],
                    classification_confidence=doc_data["classification_confidence"],
                    matched_template=doc_data["matched_template"],
                    quality_score=doc_data["quality_score"],
                    quality_details=doc_data["quality_details"],
                    ocr_status=doc_data["ocr_status"],
                    ocr_avg_confidence=doc_data["ocr_avg_confidence"],
                    template_similarity=doc_data["template_similarity"],
                    layout_details=doc_data["layout_details"],
                    tamper_score=doc_data["tamper_score"],
                    tamper_details=doc_data["tamper_details"],
                    forensic_heatmap_path=None,
                    qr_status=doc_data["qr_status"],
                    qr_details=doc_data["qr_details"],
                    anomaly_score=doc_data["anomaly_score"],
                    anomaly_label=doc_data["anomaly_label"],
                    risk_score=doc_data["risk_score"],
                    risk_label=doc_data["risk_label"],
                    risk_breakdown=None,
                    metadata_anomaly_score=doc_data["metadata_anomaly_score"],
                    metadata_details=doc_data["metadata_details"],
                    consistency_details=doc_data["consistency_details"],
                    pipeline_version="0.1.0",
                    model_version="IF-001",
                    analysis_steps=[],
                    review_status=doc_data["review_status"],
                    created_at=created,
                    completed_at=completed,
                )
                db.add(analysis)

                # Create findings
                for f in doc_data["findings"]:
                    finding = Finding(
                        analysis_id=doc_data["analysis_id"],
                        source=f["source"],
                        finding_type=f["finding_type"],
                        severity=f["severity"],
                        score=f["score"],
                        confidence=f["confidence"],
                        description=f["description"],
                        evidence=f["evidence"],
                        rule_id=f["rule_id"],
                    )
                    db.add(finding)

                # Create OCR fields
                for o in doc_data["ocr_fields"]:
                    ocr_field = OcrField(
                        analysis_id=doc_data["analysis_id"],
                        field_name=o["field_name"],
                        value=o["value"],
                        confidence=o["confidence"],
                        bbox=o["bbox"],
                    )
                    db.add(ocr_field)

                # Create risk signal breakdown
                risk_score_val = doc_data["risk_score"]
                risk_signals = [
                    ("visual_tamper", 0.25, doc_data["tamper_score"] * 100),
                    ("template_layout", 0.15, (1 - doc_data["template_similarity"]) * 100),
                    ("cross_field", 0.15, doc_data["consistency_details"]["field_mismatches"] * 20),
                    ("ml_anomaly", 0.15, abs(doc_data["anomaly_score"]) * 100),
                    ("ocr_anomalies", 0.10, (1 - doc_data["ocr_avg_confidence"]) * 70),
                    ("pattern_violations", 0.10, len(doc_data["findings"]) * 15),
                    ("metadata_anomalies", 0.05, doc_data["metadata_anomaly_score"] * 100),
                    ("image_quality", 0.05, max(0, 100 - doc_data["quality_score"])),
                ]
                for sig_name, weight, raw in risk_signals:
                    contribution = round(raw * weight, 2)
                    rs = RiskScore(
                        analysis_id=doc_data["analysis_id"],
                        signal_name=sig_name,
                        weight=weight,
                        raw_score=round(raw, 1),
                        weighted_contribution=contribution,
                    )
                    db.add(rs)

            await db.commit()
            logger.info(f"Seeded {len(MOCK_DOCUMENTS)} mock documents with full analysis data")
        except Exception as e:
            await db.rollback()
            logger.error(f"Seed failed: {e}")
