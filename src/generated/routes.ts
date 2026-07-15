/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ReservationController } from './../domains/reservation/reservation.controller.js';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AuthController } from './../domains/auth/auth.controller.js';
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';



// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
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
    "UserStatus": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["ACTIVE"]},{"dataType":"enum","enums":["WITHDRAWN"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Provider": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["LOCAL"]},{"dataType":"enum","enums":["KAKAO"]},{"dataType":"enum","enums":["GOOGLE"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__id-string--status-UserStatus--createdAt-Date--phoneNumber-string--updatedAt-Date--name-string--loginId-string--nickname-string--email-string--provider-Provider--deletedAt-Date__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"deletedAt":{"dataType":"datetime","required":true},"provider":{"ref":"Provider","required":true},"email":{"dataType":"string","required":true},"nickname":{"dataType":"string","required":true},"loginId":{"dataType":"string","required":true},"name":{"dataType":"string","required":true},"updatedAt":{"dataType":"datetime","required":true},"phoneNumber":{"dataType":"string","required":true},"createdAt":{"dataType":"datetime","required":true},"status":{"ref":"UserStatus","required":true},"id":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"message":{"dataType":"string","required":true},"code":{"dataType":"string","required":true},"success":{"dataType":"boolean","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################


    
        const argsReservationController_create: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateReservationRequestDto"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/api/v1/reservations',
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
        };
        app.patch('/api/v1/reservations/:reservationId/cancel',
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

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
