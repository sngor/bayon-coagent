"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsSyncStatus = exports.SchedulingPatternType = exports.TemplatePermission = exports.ROIEventType = exports.ABTestStatus = exports.ContentCategory = exports.PublishChannelType = exports.ScheduledContentStatus = void 0;
var ScheduledContentStatus;
(function (ScheduledContentStatus) {
    ScheduledContentStatus["SCHEDULED"] = "scheduled";
    ScheduledContentStatus["PUBLISHING"] = "publishing";
    ScheduledContentStatus["PUBLISHED"] = "published";
    ScheduledContentStatus["FAILED"] = "failed";
    ScheduledContentStatus["CANCELLED"] = "cancelled";
})(ScheduledContentStatus || (exports.ScheduledContentStatus = ScheduledContentStatus = {}));
var PublishChannelType;
(function (PublishChannelType) {
    PublishChannelType["FACEBOOK"] = "facebook";
    PublishChannelType["INSTAGRAM"] = "instagram";
    PublishChannelType["LINKEDIN"] = "linkedin";
    PublishChannelType["TWITTER"] = "twitter";
    PublishChannelType["BLOG"] = "blog";
    PublishChannelType["NEWSLETTER"] = "newsletter";
})(PublishChannelType || (exports.PublishChannelType = PublishChannelType = {}));
var ContentCategory;
(function (ContentCategory) {
    ContentCategory["BLOG_POST"] = "blog_post";
    ContentCategory["SOCIAL_MEDIA"] = "social_media";
    ContentCategory["LISTING_DESCRIPTION"] = "listing_description";
    ContentCategory["MARKET_UPDATE"] = "market_update";
    ContentCategory["NEIGHBORHOOD_GUIDE"] = "neighborhood_guide";
    ContentCategory["VIDEO_SCRIPT"] = "video_script";
    ContentCategory["NEWSLETTER"] = "newsletter";
    ContentCategory["EMAIL_TEMPLATE"] = "email_template";
})(ContentCategory || (exports.ContentCategory = ContentCategory = {}));
var ABTestStatus;
(function (ABTestStatus) {
    ABTestStatus["ACTIVE"] = "active";
    ABTestStatus["COMPLETED"] = "completed";
    ABTestStatus["CANCELLED"] = "cancelled";
    ABTestStatus["DRAFT"] = "draft";
})(ABTestStatus || (exports.ABTestStatus = ABTestStatus = {}));
var ROIEventType;
(function (ROIEventType) {
    ROIEventType["LEAD"] = "lead";
    ROIEventType["CONVERSION"] = "conversion";
    ROIEventType["REVENUE"] = "revenue";
    ROIEventType["CONSULTATION"] = "consultation";
    ROIEventType["LISTING_INQUIRY"] = "listing_inquiry";
})(ROIEventType || (exports.ROIEventType = ROIEventType = {}));
var TemplatePermission;
(function (TemplatePermission) {
    TemplatePermission["VIEW"] = "view";
    TemplatePermission["EDIT"] = "edit";
    TemplatePermission["SHARE"] = "share";
    TemplatePermission["DELETE"] = "delete";
})(TemplatePermission || (exports.TemplatePermission = TemplatePermission = {}));
var SchedulingPatternType;
(function (SchedulingPatternType) {
    SchedulingPatternType["DAILY"] = "daily";
    SchedulingPatternType["WEEKLY"] = "weekly";
    SchedulingPatternType["CUSTOM"] = "custom";
})(SchedulingPatternType || (exports.SchedulingPatternType = SchedulingPatternType = {}));
var AnalyticsSyncStatus;
(function (AnalyticsSyncStatus) {
    AnalyticsSyncStatus["PENDING"] = "pending";
    AnalyticsSyncStatus["SYNCING"] = "syncing";
    AnalyticsSyncStatus["COMPLETED"] = "completed";
    AnalyticsSyncStatus["FAILED"] = "failed";
})(AnalyticsSyncStatus || (exports.AnalyticsSyncStatus = AnalyticsSyncStatus = {}));
