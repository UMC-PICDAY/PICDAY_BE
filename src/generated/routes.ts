/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { WishlistController } from './../domains/wishlist/wishlist.controller.js';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { StudioController } from './../domains/studio/studio.controller.js';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { StudioReviewController } from './../domains/review/studioReview.controller.js';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ReviewController } from './../domains/review/review.controller.js';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ReservationController } from './../domains/reservation/reservation.controller.js';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ImageController } from './../domains/image/image.controller.js';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AuthController } from './../domains/auth/auth.controller.js';
import { expressAuthentication } from './../server/authentication.js';
// @ts-ignore - no great way to install types from subpackage
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';
import multer from 'multer';


const expressAuthenticationRecasted = expressAuthentication as (req: ExRequest, securityName: string, scopes?: string[], res?: ExResponse) => Promise<any>;


// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "WishlistItemDto": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"rating":{"dataType":"double","required":true},"minPrice":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},"region":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"thumbnail":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"studioName":{"dataType":"string","required":true},"studioId":{"dataType":"double","required":true},"wishlistId":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetWishlistsResponseDto": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"items":{"dataType":"array","array":{"dataType":"refAlias","ref":"WishlistItemDto"},"required":true},"size":{"dataType":"double","required":true},"page":{"dataType":"double","required":true},"totalCount":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetWishlistsSuccessResponseDto": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"ref":"GetWishlistsResponseDto","required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"enum","enums":["COMMON_200"],"required":true},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddWishlistResponseDto": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"studioId":{"dataType":"double","required":true},"wishlistId":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddWishlistSuccessResponseDto": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"ref":"AddWishlistResponseDto","required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"enum","enums":["COMMON_201"],"required":true},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "infer_typeofaddWishlistRequestSchema_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"studioId":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddWishlistRequestDto": {
        "dataType": "refAlias",
        "type": {"ref":"infer_typeofaddWishlistRequestSchema_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DeleteWishlistSuccessResponseDto": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"enum","enums":[null],"required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"enum","enums":["COMMON_200"],"required":true},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "output_typeofstudioDetailResponseSchema_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"notice":{"dataType":"nestedObjectLiteral","nestedProperties":{"items":{"dataType":"array","array":{"dataType":"string"},"required":true},"title":{"dataType":"string","required":true}}},"introduction":{"dataType":"string"},"studioId":{"dataType":"string"},"reviewSummary":{"dataType":"nestedObjectLiteral","nestedProperties":{"previewReview":{"dataType":"nestedObjectLiteral","nestedProperties":{"createdAt":{"dataType":"string"},"reviewId":{"dataType":"string"},"imageUrls":{"dataType":"array","array":{"dataType":"string"},"required":true},"content":{"dataType":"string","required":true},"rating":{"dataType":"double","required":true},"isBest":{"dataType":"boolean","required":true},"writerNickname":{"dataType":"string","required":true}}},"averageRating":{"dataType":"double"},"reviewCount":{"dataType":"double","required":true}},"required":true},"hairMakeupPartnerCount":{"dataType":"double","required":true},"studioInfo":{"dataType":"nestedObjectLiteral","nestedProperties":{"refundGuide":{"dataType":"array","array":{"dataType":"string"},"required":true},"shootingGuide":{"dataType":"array","array":{"dataType":"string"},"required":true},"parking":{"dataType":"array","array":{"dataType":"string"},"required":true},"operation":{"dataType":"array","array":{"dataType":"string"},"required":true}},"required":true},"serviceCodes":{"dataType":"array","array":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["HAIR_MAKEUP"]},{"dataType":"enum","enums":["PARKING"]},{"dataType":"enum","enums":["COSTUME"]},{"dataType":"enum","enums":["WIFI"]}]},"required":true},"representativeProducts":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"thumbnailUrl":{"dataType":"string"},"studioProductId":{"dataType":"string"},"price":{"dataType":"double","required":true},"productName":{"dataType":"string","required":true}}},"required":true},"location":{"dataType":"nestedObjectLiteral","nestedProperties":{"walkingMinutes":{"dataType":"double"},"nearestStation":{"dataType":"string"},"longitude":{"dataType":"double"},"latitude":{"dataType":"double"},"address":{"dataType":"string"},"district":{"dataType":"string"},"locationCategory":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["HONGDAE"]},{"dataType":"enum","enums":["GANGNAM"]},{"dataType":"enum","enums":["SEONGSU"]},{"dataType":"enum","enums":["YEONNAM"]},{"dataType":"enum","enums":["KONDAE"]},{"dataType":"enum","enums":["SINCHON"]},{"dataType":"enum","enums":["JAMSIL"]},{"dataType":"enum","enums":["APGUJEONG"]},{"dataType":"enum","enums":["HYEHWA"]},{"dataType":"enum","enums":["JONGNO"]}]},"stationLineCodes":{"dataType":"array","array":{"dataType":"double"},"required":true}},"required":true},"isWishlisted":{"dataType":"boolean","required":true},"imageUrls":{"dataType":"array","array":{"dataType":"string"},"required":true},"studioName":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "StudioDetailResponseDto": {
        "dataType": "refAlias",
        "type": {"ref":"output_typeofstudioDetailResponseSchema_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_StudioDetailResponseDto_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"union","subSchemas":[{"ref":"StudioDetailResponseDto"},{"dataType":"enum","enums":[null]}],"required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"string","required":true},"success":{"dataType":"boolean","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AppErrorResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"enum","enums":[null],"required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"string","required":true},"success":{"dataType":"enum","enums":[false],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "output_typeofgetStudioSlotsSuccessResponseSchema_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"endTime":{"dataType":"string"},"startTime":{"dataType":"string"},"slotId":{"dataType":"string"},"isAvailable":{"dataType":"boolean","required":true}}},"required":true},"message":{"dataType":"enum","enums":["예약 가능 시간 조회에 성공했습니다."],"required":true},"code":{"dataType":"enum","enums":["COMMON_200"],"required":true},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetStudioSlotsSuccessResponseDto": {
        "dataType": "refAlias",
        "type": {"ref":"output_typeofgetStudioSlotsSuccessResponseSchema_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "output_typeofstudioProductsResponseSchema_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"selectedSlot":{"dataType":"nestedObjectLiteral","nestedProperties":{"endTime":{"dataType":"string"},"startTime":{"dataType":"string"},"date":{"dataType":"string"},"timeSlotId":{"dataType":"string"},"isAvailable":{"dataType":"boolean","required":true}}},"studioId":{"dataType":"string"},"productGroups":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"products":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"shortDescription":{"dataType":"string"},"studioProductId":{"dataType":"string"},"basePeople":{"dataType":"double","required":true},"price":{"dataType":"double","required":true},"imageUrls":{"dataType":"array","array":{"dataType":"string"},"required":true},"productName":{"dataType":"string","required":true},"imageCount":{"dataType":"double","required":true}}},"required":true},"shootingCategory":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["ID_PHOTO"]},{"dataType":"enum","enums":["PROFILE"]},{"dataType":"enum","enums":["PERSONAL_PORTRAIT"]},{"dataType":"enum","enums":["JOB_PHOTO"]},{"dataType":"enum","enums":["FAMILY"]},{"dataType":"enum","enums":["FRIENDSHIP"]}],"required":true}}},"required":true},"studioName":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "StudioProductsResponseDto": {
        "dataType": "refAlias",
        "type": {"ref":"output_typeofstudioProductsResponseSchema_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetStudioProductsSuccessResponseDto": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"ref":"StudioProductsResponseDto","required":true},"message":{"dataType":"enum","enums":["사진관 컨셉 목록 조회에 성공했습니다."],"required":true},"code":{"dataType":"enum","enums":["COMMON_200"],"required":true},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "output_typeofstudioProductDetailResponseSchema_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"studioProductId":{"dataType":"string"},"studioId":{"dataType":"string"},"imageUrls":{"dataType":"array","array":{"dataType":"string"},"required":true},"productName":{"dataType":"string","required":true},"studioName":{"dataType":"string","required":true},"imageCount":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "StudioProductDetailResponseDto": {
        "dataType": "refAlias",
        "type": {"ref":"output_typeofstudioProductDetailResponseSchema_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_StudioProductDetailResponseDto_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"union","subSchemas":[{"ref":"StudioProductDetailResponseDto"},{"dataType":"enum","enums":[null]}],"required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"string","required":true},"success":{"dataType":"boolean","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "infer_typeofreviewKeywordSchema_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["KIND_SERVICE"]},{"dataType":"enum","enums":["DETAILED_RETOUCH"]},{"dataType":"enum","enums":["ON_TIME"]},{"dataType":"enum","enums":["COMFORTABLE_MOOD"]},{"dataType":"enum","enums":["REASONABLE_PRICE"]},{"dataType":"enum","enums":["SATISFYING_RESULT"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ReviewKeywordValue": {
        "dataType": "refAlias",
        "type": {"ref":"infer_typeofreviewKeywordSchema_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ReviewListItemDto": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"createdAt":{"dataType":"string","required":true},"isBest":{"dataType":"boolean","required":true},"isLiked":{"dataType":"boolean","required":true},"likeCount":{"dataType":"double","required":true},"images":{"dataType":"array","array":{"dataType":"string"},"required":true},"keywords":{"dataType":"array","array":{"dataType":"refAlias","ref":"ReviewKeywordValue"},"required":true},"content":{"dataType":"string","required":true},"rating":{"dataType":"double","required":true},"writerNickname":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"reviewId":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetReviewsResponseDto": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"items":{"dataType":"array","array":{"dataType":"refAlias","ref":"ReviewListItemDto"},"required":true},"size":{"dataType":"double","required":true},"page":{"dataType":"double","required":true},"summary":{"dataType":"nestedObjectLiteral","nestedProperties":{"photoReviewCount":{"dataType":"double","required":true},"totalCount":{"dataType":"double","required":true},"avgRating":{"dataType":"double","required":true}},"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetReviewsSuccessResponseDto": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"ref":"GetReviewsResponseDto","required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"enum","enums":["COMMON_200"],"required":true},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateReviewSuccessResponseDto": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"nestedObjectLiteral","nestedProperties":{"reviewId":{"dataType":"double","required":true}},"required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"enum","enums":["COMMON_201"],"required":true},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "infer_typeofcreateReviewRequestSchema_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"imageUrls":{"dataType":"array","array":{"dataType":"string"}},"keywords":{"dataType":"array","array":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["KIND_SERVICE"]},{"dataType":"enum","enums":["DETAILED_RETOUCH"]},{"dataType":"enum","enums":["ON_TIME"]},{"dataType":"enum","enums":["COMFORTABLE_MOOD"]},{"dataType":"enum","enums":["REASONABLE_PRICE"]},{"dataType":"enum","enums":["SATISFYING_RESULT"]}]}},"content":{"dataType":"string","required":true},"rating":{"dataType":"double","required":true},"reservationId":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateReviewRequestDto": {
        "dataType": "refAlias",
        "type": {"ref":"infer_typeofcreateReviewRequestSchema_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateReviewSuccessResponseDto": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"nestedObjectLiteral","nestedProperties":{"reviewId":{"dataType":"double","required":true}},"required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"enum","enums":["COMMON_200"],"required":true},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "infer_typeofupdateReviewRequestSchema_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"imageUrls":{"dataType":"array","array":{"dataType":"string"}},"keywords":{"dataType":"array","array":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["KIND_SERVICE"]},{"dataType":"enum","enums":["DETAILED_RETOUCH"]},{"dataType":"enum","enums":["ON_TIME"]},{"dataType":"enum","enums":["COMFORTABLE_MOOD"]},{"dataType":"enum","enums":["REASONABLE_PRICE"]},{"dataType":"enum","enums":["SATISFYING_RESULT"]}]}},"content":{"dataType":"string"},"rating":{"dataType":"double"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateReviewRequestDto": {
        "dataType": "refAlias",
        "type": {"ref":"infer_typeofupdateReviewRequestSchema_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DeleteReviewSuccessResponseDto": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"enum","enums":[null],"required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"enum","enums":["COMMON_200"],"required":true},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ReviewLikeResponseDto": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"likeCount":{"dataType":"double","required":true},"reviewId":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddReviewLikeSuccessResponseDto": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"ref":"ReviewLikeResponseDto","required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"enum","enums":["COMMON_201"],"required":true},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RemoveReviewLikeSuccessResponseDto": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"ref":"ReviewLikeResponseDto","required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"enum","enums":["COMMON_200"],"required":true},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "output_typeofcreateReservationSuccessResponseSchema_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"nestedObjectLiteral","nestedProperties":{"createdAt":{"dataType":"string"},"reservationId":{"dataType":"string"},"totalPrice":{"dataType":"double","required":true},"status":{"dataType":"enum","enums":["RESERVED"],"required":true}},"required":true},"message":{"dataType":"enum","enums":["예약이 성공적으로 완료되었습니다."],"required":true},"code":{"dataType":"enum","enums":["COMMON_201"],"required":true},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateReservationSuccessResponseDto": {
        "dataType": "refAlias",
        "type": {"ref":"output_typeofcreateReservationSuccessResponseSchema_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "infer_typeofcreateReservationRequestSchema_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"agreedTermIds":{"dataType":"array","array":{"dataType":"double"},"required":true},"paymentMethod":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["KAKAOPAY"]},{"dataType":"enum","enums":["NAVERPAY"]},{"dataType":"enum","enums":["TOSSPAY"]},{"dataType":"enum","enums":["TRANSFER"]},{"dataType":"enum","enums":["CARD"]}],"required":true},"reserveePhone":{"dataType":"string","required":true},"reserveeName":{"dataType":"string","required":true},"timeSlotId":{"dataType":"double","required":true},"studioProductId":{"dataType":"double","required":true},"studioId":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateReservationRequestDto": {
        "dataType": "refAlias",
        "type": {"ref":"infer_typeofcreateReservationRequestSchema_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__status-CANCELLED--reservationId_63_-string--canceledAt_63_-string__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"canceledAt":{"dataType":"string"},"reservationId":{"dataType":"string"},"status":{"dataType":"enum","enums":["CANCELLED"],"required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"string","required":true},"success":{"dataType":"boolean","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__status-RESERVED-or-CANCELLED-or-COMPLETED--reserveeName-string--reserveePhone-string--totalPrice-number--studio_58__name-string--id_63_-string_--studioProduct_58__name-string--price-number--id_63_-string_--timeSlot_58__date_63_-string--startTime_63_-string--endTime_63_-string_--reservationId_63_-string--createdAt_63_-string--canceledAt_63_-string__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"canceledAt":{"dataType":"string"},"createdAt":{"dataType":"string"},"reservationId":{"dataType":"string"},"timeSlot":{"dataType":"nestedObjectLiteral","nestedProperties":{"endTime":{"dataType":"string"},"startTime":{"dataType":"string"},"date":{"dataType":"string"}},"required":true},"studioProduct":{"dataType":"nestedObjectLiteral","nestedProperties":{"id":{"dataType":"string"},"price":{"dataType":"double","required":true},"name":{"dataType":"string","required":true}},"required":true},"studio":{"dataType":"nestedObjectLiteral","nestedProperties":{"id":{"dataType":"string"},"name":{"dataType":"string","required":true}},"required":true},"totalPrice":{"dataType":"double","required":true},"reserveePhone":{"dataType":"string","required":true},"reserveeName":{"dataType":"string","required":true},"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["RESERVED"]},{"dataType":"enum","enums":["CANCELLED"]},{"dataType":"enum","enums":["COMPLETED"]}],"required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"string","required":true},"success":{"dataType":"boolean","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__studioName-string--conceptName-string--reservationTime-string--totalPrice-number--status-RESERVED-or-CANCELLED-or-COMPLETED--reservationId_63_-string--reservationDate_63_-string_-Array_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"reservationDate":{"dataType":"string"},"reservationId":{"dataType":"string"},"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["RESERVED"]},{"dataType":"enum","enums":["CANCELLED"]},{"dataType":"enum","enums":["COMPLETED"]}],"required":true},"totalPrice":{"dataType":"double","required":true},"reservationTime":{"dataType":"string","required":true},"conceptName":{"dataType":"string","required":true},"studioName":{"dataType":"string","required":true}}}},{"dataType":"enum","enums":[null]}],"required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"string","required":true},"success":{"dataType":"boolean","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UploadImageResponseDto": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"imageUrl":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UploadImageSuccessResponseDto": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"ref":"UploadImageResponseDto","required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"enum","enums":["COMMON_201"],"required":true},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__authUrl-string__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"authUrl":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"string","required":true},"success":{"dataType":"boolean","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AuthErrorResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"enum","enums":[null],"required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"string","required":true},"success":{"dataType":"enum","enums":[false],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Provider": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["LOCAL"]},{"dataType":"enum","enums":["KAKAO"]},{"dataType":"enum","enums":["GOOGLE"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SocialLoginResponseData": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"token":{"dataType":"nestedObjectLiteral","nestedProperties":{"refreshTokenExpiresIn":{"dataType":"double","required":true},"accessTokenExpiresIn":{"dataType":"double","required":true},"refreshToken":{"dataType":"string","required":true},"accessToken":{"dataType":"string","required":true}},"required":true},"user":{"dataType":"nestedObjectLiteral","nestedProperties":{"provider":{"ref":"Provider","required":true},"profileImageUrl":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"email":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"nickname":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"id":{"dataType":"string","required":true}},"required":true},"isNewUser":{"dataType":"enum","enums":[false],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"socialInfo":{"dataType":"nestedObjectLiteral","nestedProperties":{"phoneNumber":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"name":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"email":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}},"required":true},"signupToken":{"dataType":"string","required":true},"isNewUser":{"dataType":"enum","enums":[true],"required":true}}}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_SocialLoginResponseData_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"union","subSchemas":[{"ref":"SocialLoginResponseData"},{"dataType":"enum","enums":[null]}],"required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"string","required":true},"success":{"dataType":"boolean","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__user_58__id_63_-string--nickname_63_-string--provider_63_-LOCAL-or-KAKAO-or-GOOGLE-or-APPLE_--token_58__accessToken-string--refreshToken-string--accessTokenExpiresIn-number--refreshTokenExpiresIn-number___": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"token":{"dataType":"nestedObjectLiteral","nestedProperties":{"refreshTokenExpiresIn":{"dataType":"double","required":true},"accessTokenExpiresIn":{"dataType":"double","required":true},"refreshToken":{"dataType":"string","required":true},"accessToken":{"dataType":"string","required":true}},"required":true},"user":{"dataType":"nestedObjectLiteral","nestedProperties":{"provider":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["LOCAL"]},{"dataType":"enum","enums":["KAKAO"]},{"dataType":"enum","enums":["GOOGLE"]},{"dataType":"enum","enums":["APPLE"]}]},"nickname":{"dataType":"string"},"id":{"dataType":"string"}},"required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"string","required":true},"success":{"dataType":"boolean","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserStatus": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["ACTIVE"]},{"dataType":"enum","enums":["WITHDRAWN"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__id-string--createdAt-Date--status-UserStatus--name-string--nickname-string--provider-Provider--refreshToken-string--loginId-string--email-string--phoneNumber-string--updatedAt-Date--deletedAt-Date__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"deletedAt":{"dataType":"datetime","required":true},"updatedAt":{"dataType":"datetime","required":true},"phoneNumber":{"dataType":"string","required":true},"email":{"dataType":"string","required":true},"loginId":{"dataType":"string","required":true},"refreshToken":{"dataType":"string","required":true},"provider":{"ref":"Provider","required":true},"nickname":{"dataType":"string","required":true},"name":{"dataType":"string","required":true},"status":{"ref":"UserStatus","required":true},"createdAt":{"dataType":"datetime","required":true},"id":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"string","required":true},"success":{"dataType":"boolean","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__user_58__id-string--loginId-string--nickname-string--provider-Provider_--token_58__accessToken-string--refreshToken-string--accessTokenExpiresIn-number--refreshTokenExpiresIn-number___": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"token":{"dataType":"nestedObjectLiteral","nestedProperties":{"refreshTokenExpiresIn":{"dataType":"double","required":true},"accessTokenExpiresIn":{"dataType":"double","required":true},"refreshToken":{"dataType":"string","required":true},"accessToken":{"dataType":"string","required":true}},"required":true},"user":{"dataType":"nestedObjectLiteral","nestedProperties":{"provider":{"ref":"Provider","required":true},"nickname":{"dataType":"string","required":true},"loginId":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}},"required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"string","required":true},"success":{"dataType":"boolean","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__token_58__accessToken-string--refreshToken-string--accessTokenExpiresIn-number--refreshTokenExpiresIn-number___": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"token":{"dataType":"nestedObjectLiteral","nestedProperties":{"refreshTokenExpiresIn":{"dataType":"double","required":true},"accessTokenExpiresIn":{"dataType":"double","required":true},"refreshToken":{"dataType":"string","required":true},"accessToken":{"dataType":"string","required":true}},"required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"string","required":true},"success":{"dataType":"boolean","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__available-boolean__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"available":{"dataType":"boolean","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"string","required":true},"success":{"dataType":"boolean","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__user_58__name-string--nickname-string--email-string--provider-LOCAL-or-KAKAO-or-GOOGLE-or-APPLE--id_63_-string___": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"user":{"dataType":"nestedObjectLiteral","nestedProperties":{"id":{"dataType":"string"},"provider":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["LOCAL"]},{"dataType":"enum","enums":["KAKAO"]},{"dataType":"enum","enums":["GOOGLE"]},{"dataType":"enum","enums":["APPLE"]}],"required":true},"email":{"dataType":"string","required":true},"nickname":{"dataType":"string","required":true},"name":{"dataType":"string","required":true}},"required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"string","required":true},"success":{"dataType":"boolean","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__user_58__nickname-string--id_63_-string___": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"user":{"dataType":"nestedObjectLiteral","nestedProperties":{"id":{"dataType":"string"},"nickname":{"dataType":"string","required":true}},"required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"string","required":true},"success":{"dataType":"boolean","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router,opts?:{multer?:ReturnType<typeof multer>}) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################

    const upload = opts?.multer ||  multer({"limits":{"fileSize":8388608}});

    
        const argsWishlistController_list: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                page: {"in":"query","name":"page","dataType":"string"},
                size: {"in":"query","name":"size","dataType":"string"},
        };
        app.get('/api/v1/wishlists',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(WishlistController)),
            ...(fetchMiddlewares<RequestHandler>(WishlistController.prototype.list)),

            async function WishlistController_list(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsWishlistController_list, request, response });

                const controller = new WishlistController();

              await templateService.apiHandler({
                methodName: 'list',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsWishlistController_add: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"AddWishlistRequestDto"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/api/v1/wishlists',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(WishlistController)),
            ...(fetchMiddlewares<RequestHandler>(WishlistController.prototype.add)),

            async function WishlistController_add(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsWishlistController_add, request, response });

                const controller = new WishlistController();

              await templateService.apiHandler({
                methodName: 'add',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsWishlistController_remove: Record<string, TsoaRoute.ParameterSchema> = {
                studioId: {"in":"path","name":"studioId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/api/v1/wishlists/:studioId',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(WishlistController)),
            ...(fetchMiddlewares<RequestHandler>(WishlistController.prototype.remove)),

            async function WishlistController_remove(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsWishlistController_remove, request, response });

                const controller = new WishlistController();

              await templateService.apiHandler({
                methodName: 'remove',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsStudioController_getStudioDetail: Record<string, TsoaRoute.ParameterSchema> = {
                studioId: {"in":"path","name":"studioId","required":true,"dataType":"string"},
        };
        app.get('/api/v1/studios/:studioId',
            ...(fetchMiddlewares<RequestHandler>(StudioController)),
            ...(fetchMiddlewares<RequestHandler>(StudioController.prototype.getStudioDetail)),

            async function StudioController_getStudioDetail(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStudioController_getStudioDetail, request, response });

                const controller = new StudioController();

              await templateService.apiHandler({
                methodName: 'getStudioDetail',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsStudioController_getStudioSlots: Record<string, TsoaRoute.ParameterSchema> = {
                studioId: {"in":"path","name":"studioId","required":true,"dataType":"string"},
                date: {"in":"query","name":"date","dataType":"string"},
        };
        app.get('/api/v1/studios/:studioId/slots',
            ...(fetchMiddlewares<RequestHandler>(StudioController)),
            ...(fetchMiddlewares<RequestHandler>(StudioController.prototype.getStudioSlots)),

            async function StudioController_getStudioSlots(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStudioController_getStudioSlots, request, response });

                const controller = new StudioController();

              await templateService.apiHandler({
                methodName: 'getStudioSlots',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsStudioController_getStudioProducts: Record<string, TsoaRoute.ParameterSchema> = {
                studioId: {"in":"path","name":"studioId","required":true,"dataType":"string"},
                timeSlotId: {"in":"query","name":"timeSlotId","dataType":"string"},
        };
        app.get('/api/v1/studios/:studioId/products',
            ...(fetchMiddlewares<RequestHandler>(StudioController)),
            ...(fetchMiddlewares<RequestHandler>(StudioController.prototype.getStudioProducts)),

            async function StudioController_getStudioProducts(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStudioController_getStudioProducts, request, response });

                const controller = new StudioController();

              await templateService.apiHandler({
                methodName: 'getStudioProducts',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsStudioController_getStudioProductDetail: Record<string, TsoaRoute.ParameterSchema> = {
                studioId: {"in":"path","name":"studioId","required":true,"dataType":"string"},
                studioProductId: {"in":"path","name":"studioProductId","required":true,"dataType":"string"},
        };
        app.get('/api/v1/studios/:studioId/products/:studioProductId',
            ...(fetchMiddlewares<RequestHandler>(StudioController)),
            ...(fetchMiddlewares<RequestHandler>(StudioController.prototype.getStudioProductDetail)),

            async function StudioController_getStudioProductDetail(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStudioController_getStudioProductDetail, request, response });

                const controller = new StudioController();

              await templateService.apiHandler({
                methodName: 'getStudioProductDetail',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsStudioReviewController_listByStudio: Record<string, TsoaRoute.ParameterSchema> = {
                studioId: {"in":"path","name":"studioId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                sort: {"in":"query","name":"sort","dataType":"string"},
                photoOnly: {"in":"query","name":"photoOnly","dataType":"string"},
                page: {"in":"query","name":"page","dataType":"string"},
                size: {"in":"query","name":"size","dataType":"string"},
        };
        app.get('/api/v1/studios/:studioId/reviews',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StudioReviewController)),
            ...(fetchMiddlewares<RequestHandler>(StudioReviewController.prototype.listByStudio)),

            async function StudioReviewController_listByStudio(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStudioReviewController_listByStudio, request, response });

                const controller = new StudioReviewController();

              await templateService.apiHandler({
                methodName: 'listByStudio',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsReviewController_create: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateReviewRequestDto"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/api/v1/reviews',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ReviewController)),
            ...(fetchMiddlewares<RequestHandler>(ReviewController.prototype.create)),

            async function ReviewController_create(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsReviewController_create, request, response });

                const controller = new ReviewController();

              await templateService.apiHandler({
                methodName: 'create',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsReviewController_update: Record<string, TsoaRoute.ParameterSchema> = {
                reviewId: {"in":"path","name":"reviewId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateReviewRequestDto"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.patch('/api/v1/reviews/:reviewId',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ReviewController)),
            ...(fetchMiddlewares<RequestHandler>(ReviewController.prototype.update)),

            async function ReviewController_update(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsReviewController_update, request, response });

                const controller = new ReviewController();

              await templateService.apiHandler({
                methodName: 'update',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsReviewController_remove: Record<string, TsoaRoute.ParameterSchema> = {
                reviewId: {"in":"path","name":"reviewId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/api/v1/reviews/:reviewId',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ReviewController)),
            ...(fetchMiddlewares<RequestHandler>(ReviewController.prototype.remove)),

            async function ReviewController_remove(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsReviewController_remove, request, response });

                const controller = new ReviewController();

              await templateService.apiHandler({
                methodName: 'remove',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsReviewController_addLike: Record<string, TsoaRoute.ParameterSchema> = {
                reviewId: {"in":"path","name":"reviewId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/api/v1/reviews/:reviewId/like',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ReviewController)),
            ...(fetchMiddlewares<RequestHandler>(ReviewController.prototype.addLike)),

            async function ReviewController_addLike(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsReviewController_addLike, request, response });

                const controller = new ReviewController();

              await templateService.apiHandler({
                methodName: 'addLike',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsReviewController_removeLike: Record<string, TsoaRoute.ParameterSchema> = {
                reviewId: {"in":"path","name":"reviewId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/api/v1/reviews/:reviewId/like',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ReviewController)),
            ...(fetchMiddlewares<RequestHandler>(ReviewController.prototype.removeLike)),

            async function ReviewController_removeLike(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsReviewController_removeLike, request, response });

                const controller = new ReviewController();

              await templateService.apiHandler({
                methodName: 'removeLike',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsReservationController_create: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateReservationRequestDto"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/api/v1/reservations',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ReservationController)),
            ...(fetchMiddlewares<RequestHandler>(ReservationController.prototype.create)),

            async function ReservationController_create(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsReservationController_create, request, response });

                const controller = new ReservationController();

              await templateService.apiHandler({
                methodName: 'create',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsReservationController_cancel: Record<string, TsoaRoute.ParameterSchema> = {
                reservationId: {"in":"path","name":"reservationId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.patch('/api/v1/reservations/:reservationId/cancel',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ReservationController)),
            ...(fetchMiddlewares<RequestHandler>(ReservationController.prototype.cancel)),

            async function ReservationController_cancel(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsReservationController_cancel, request, response });

                const controller = new ReservationController();

              await templateService.apiHandler({
                methodName: 'cancel',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsReservationController_detail: Record<string, TsoaRoute.ParameterSchema> = {
                reservationId: {"in":"path","name":"reservationId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/v1/reservations/:reservationId',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ReservationController)),
            ...(fetchMiddlewares<RequestHandler>(ReservationController.prototype.detail)),

            async function ReservationController_detail(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsReservationController_detail, request, response });

                const controller = new ReservationController();

              await templateService.apiHandler({
                methodName: 'detail',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsReservationController_list: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                status: {"in":"query","name":"status","dataType":"string"},
        };
        app.get('/api/v1/reservations',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ReservationController)),
            ...(fetchMiddlewares<RequestHandler>(ReservationController.prototype.list)),

            async function ReservationController_list(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsReservationController_list, request, response });

                const controller = new ReservationController();

              await templateService.apiHandler({
                methodName: 'list',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsImageController_upload: Record<string, TsoaRoute.ParameterSchema> = {
                file: {"in":"formData","name":"file","dataType":"file"},
        };
        app.post('/api/v1/images',
            authenticateMiddleware([{"jwt":[]}]),
            upload.fields([
                {
                    name: "file",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(ImageController)),
            ...(fetchMiddlewares<RequestHandler>(ImageController.prototype.upload)),

            async function ImageController_upload(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsImageController_upload, request, response });

                const controller = new ImageController();

              await templateService.apiHandler({
                methodName: 'upload',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_getSocialAuthUrl: Record<string, TsoaRoute.ParameterSchema> = {
                provider: {"in":"path","name":"provider","required":true,"dataType":"string"},
        };
        app.get('/api/v1/auth/:provider/url',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.getSocialAuthUrl)),

            async function AuthController_getSocialAuthUrl(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_getSocialAuthUrl, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'getSocialAuthUrl',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_socialLogin: Record<string, TsoaRoute.ParameterSchema> = {
                provider: {"in":"path","name":"provider","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"dataType":"any"},
        };
        app.post('/api/v1/auth/:provider/login',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.socialLogin)),

            async function AuthController_socialLogin(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_socialLogin, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'socialLogin',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_completeSocialSignup: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"dataType":"any"},
        };
        app.post('/api/v1/auth/signup/complete',
            authenticateMiddleware([{"signup":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.completeSocialSignup)),

            async function AuthController_completeSocialSignup(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_completeSocialSignup, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'completeSocialSignup',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_signup: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"any"},
        };
        app.post('/api/v1/auth/signup',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.signup)),

            async function AuthController_signup(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_signup, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'signup',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_login: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"any"},
        };
        app.post('/api/v1/auth/login',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.login)),

            async function AuthController_login(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_login, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'login',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_refresh: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","dataType":"any"},
        };
        app.post('/api/v1/auth/refresh',
            authenticateMiddleware([{"refresh":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.refresh)),

            async function AuthController_refresh(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_refresh, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'refresh',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_checkLoginId: Record<string, TsoaRoute.ParameterSchema> = {
                loginId: {"in":"query","name":"loginId","dataType":"string"},
        };
        app.get('/api/v1/auth/loginid/check',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.checkLoginId)),

            async function AuthController_checkLoginId(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_checkLoginId, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'checkLoginId',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_checkNickname: Record<string, TsoaRoute.ParameterSchema> = {
                nickname: {"in":"query","name":"nickname","dataType":"string"},
        };
        app.get('/api/v1/auth/nickname/check',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.checkNickname)),

            async function AuthController_checkNickname(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_checkNickname, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'checkNickname',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_getMe: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/v1/auth/me',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.getMe)),

            async function AuthController_getMe(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_getMe, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'getMe',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_updateMe: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"dataType":"any"},
        };
        app.patch('/api/v1/auth/me',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.updateMe)),

            async function AuthController_updateMe(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_updateMe, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'updateMe',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
        return async function runAuthenticationMiddleware(request: any, response: any, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            // keep track of failed auth attempts so we can hand back the most
            // recent one.  This behavior was previously existing so preserving it
            // here
            const failedAttempts: any[] = [];
            const pushAndRethrow = (error: any) => {
                failedAttempts.push(error);
                throw error;
            };

            const secMethodOrPromises: Promise<any>[] = [];
            for (const secMethod of security) {
                if (Object.keys(secMethod).length > 1) {
                    const secMethodAndPromises: Promise<any>[] = [];

                    for (const name in secMethod) {
                        secMethodAndPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }

                    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

                    secMethodOrPromises.push(Promise.all(secMethodAndPromises)
                        .then(users => { return users[0]; }));
                } else {
                    for (const name in secMethod) {
                        secMethodOrPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }
                }
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            try {
                request['user'] = await Promise.any(secMethodOrPromises);

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }

                next();
            }
            catch(err) {
                // Show most recent error as response
                const error = failedAttempts.pop();
                error.status = error.status || 401;

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }
                next(error);
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        }
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
