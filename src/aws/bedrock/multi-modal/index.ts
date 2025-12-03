/**
 * Multi-Modal Processing Module
 * 
 * This module provides specialized strands for processing different media types
 * including images, videos, audio, and documents.
 * 
 * Features:
 * - Image Analysis: Quality assessment, content identification, improvement suggestions
 * - Video Script Generation: Engagement hooks, structured sections, platform optimization
 * - Audio Content Creation: Coming soon
 * - Document Processing: Coming soon
 */

export {
    ImageAnalysisStrand,
    getImageAnalysisStrand,
    resetImageAnalysisStrand,
    type ImageQualityMetrics,
    type ImageContent,
    type ImageImprovement,
    type ImageAnalysis,
    type ImageAnalysisInput,
} from './image-analysis-strand';

export {
    VideoScriptGenerator,
    getVideoScriptGenerator,
    resetVideoScriptGenerator,
    type VideoPlatform,
    type VideoStyle,
    type ScriptSection,
    type VideoScript,
    type VideoScriptInput,
} from './video-script-generator';

export {
    AudioContentCreator,
    getAudioContentCreator,
    resetAudioContentCreator,
    type AudioFormat,
    type AudioStyle,
    type PacingNote,
    type PronunciationGuide,
    type AudioSegment,
    type AudioScript,
    type AudioContentInput,
} from './audio-content-creator';

export {
    DocumentProcessor,
    getDocumentProcessor,
    resetDocumentProcessor,
    type DocumentType,
    type DocumentInsight,
    type DocumentAnalysis,
    type DocumentProcessingInput,
} from './document-processor';

export {
    CrossModalConsistencyChecker,
    getCrossModalConsistencyChecker,
    resetCrossModalConsistencyChecker,
    type ContentType,
    type ContentItem,
    type ConsistencySeverity,
    type ConsistencyIssueType,
    type ConsistencyIssue,
    type MessageAlignment,
    type BrandingConsistency,
    type ConsistencyValidationResult,
    type ConsistencyCheckInput,
} from './cross-modal-consistency-checker';
