sap.ui.core.BusyIndicator.show();
sap.ui.getCore().attachInit( () => {
    "use strict";

    sap.ui.controller("z2ui5_controller", {
        async onAfterRendering() {
            if (!sap.z2ui5.oResponse.PARAMS) {
                return;
            }

            const { S_POPUP, S_VIEW_NEST, S_VIEW_NEST2, S_POPOVER } = sap.z2ui5.oResponse.PARAMS;

            if (S_POPUP.CHECK_DESTROY) {
                sap.z2ui5.oController.PopupDestroy();
            }
            if (S_POPOVER.CHECK_DESTROY) {
                sap.z2ui5.oController.PopoverDestroy();
            }

            if (S_POPUP.XML) {
                sap.z2ui5.oController.PopupDestroy();
                await this.displayFragment(S_POPUP.XML, 'oViewPopup');
            }

            if (!sap.z2ui5.checkNestAfter ) { if ( S_VIEW_NEST.XML) {
                sap.z2ui5.oController.NestViewDestroy();
                await this.displayNestedView(S_VIEW_NEST.XML, 'oViewNest', 'S_VIEW_NEST');
                sap.z2ui5.checkNestAfter = true;
            }}

            if (!sap.z2ui5.checkNestAfter2) { if ( S_VIEW_NEST2.XML) {
                sap.z2ui5.oController.NestViewDestroy2();
                await this.displayNestedView(S_VIEW_NEST2.XML, 'oViewNest2', 'S_VIEW_NEST2');
                sap.z2ui5.checkNestAfter2 = true;
            }}

            if (S_POPOVER.XML) {
                await this.displayFragment(S_POPOVER.XML, 'oViewPopover', S_POPOVER.OPEN_BY_ID);
            }

            sap.ui.core.BusyIndicator.hide();

            if (sap.z2ui5.isBusy) {
                sap.z2ui5.isBusy = false;
            }
            if (sap.z2ui5.busyDialog) {
                sap.z2ui5.busyDialog.close();
            }
        },

        async displayFragment(xml, viewProp, openById) {
            try {
                const oFragment = await sap.ui.core.Fragment.load({
                    definition: xml,
                    controller: sap.z2ui5.oController,
                });

                let oview_model = new sap.ui.model.json.JSONModel(sap.z2ui5.oResponse.OVIEWMODEL);
                oview_model.setSizeLimit(sap.z2ui5.JSON_MODEL_LIMIT);
                oFragment.setModel(oview_model);

                let oControl = openById ? this.getControlById(openById) : null;
                if (oControl) {
                    oFragment.openBy(oControl);
                } else {
                    oFragment.open();
                }

                sap.z2ui5[viewProp] = oFragment;
            } catch (e) {
                console.error('Error loading fragment:', e);
            }
        },

        async displayNestedView(xml, viewProp, viewNestId) {
            try {
                const oView = await sap.ui.core.mvc.XMLView.create({
                    definition: xml,
                    controller: sap.z2ui5.oControllerNest,
                });

                let oview_model = new sap.ui.model.json.JSONModel(sap.z2ui5.oResponse.OVIEWMODEL);
                oview_model.setSizeLimit(sap.z2ui5.JSON_MODEL_LIMIT);
                oView.setModel(oview_model);

                let oParent = sap.z2ui5.oView.byId(sap.z2ui5.oResponse.PARAMS[viewNestId].ID);
                if (oParent) {
                    try {
                        oParent[sap.z2ui5.oResponse.PARAMS[viewNestId].METHOD_DESTROY]();
                    } catch { }
                    oParent[sap.z2ui5.oResponse.PARAMS[viewNestId].METHOD_INSERT](oView);
                }

                sap.z2ui5[viewProp] = oView;
            } catch (e) {
                console.error('Error loading view:', e);
            }
        },

        getControlById(id) {
            let oControl = sap.ui.getCore().byId(id);
            if (!oControl) {
                oControl = sap.z2ui5.oView.byId(id) || sap.z2ui5.oViewNest.byId(id) || sap.z2ui5.oViewNest2.byId(id);
            }
            return oControl;
        },

        PopupDestroy() {
            if (!sap.z2ui5.oViewPopup) {
                return;
            }
            if (sap.z2ui5.oViewPopup.close) {
                try {
                    sap.z2ui5.oViewPopup.close();
                } catch { }
            }
            sap.z2ui5.oViewPopup.destroy();
        }
        ,
        PopoverDestroy: () => {
            if (!sap.z2ui5.oViewPopover) {
                return;
            }
            if (sap.z2ui5.oViewPopover.close) {
                try {
                    sap.z2ui5.oViewPopover.close();
                } catch { }
            }
            sap.z2ui5.oViewPopover.destroy();
        }
        ,
        NestViewDestroy() {
            if (!sap.z2ui5.oViewNest) {
                return;
            }
            sap.z2ui5.oViewNest.destroy();
        }
        ,
        NestViewDestroy2() {
            if (!sap.z2ui5.oViewNest2) {
                return;
            }
            sap.z2ui5.oViewNest2.destroy();
        }
        ,
        ViewDestroy() {
            if (!sap.z2ui5.oView) {
                return;
            }
            sap.z2ui5.oView.destroy();
        }
        ,
        onEventFrontend(...args) {

            sap.z2ui5.onBeforeEventFrontend.forEach(item => {
                if (item !== undefined) {
                    item(args);
             } } )
            
            switch (args[0].EVENT) {
                case 'CROSS_APP_NAV_TO_PREV_APP':
                    let oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
                    oCrossAppNavigator.backToPreviousApp();
                    break;
                case 'CROSS_APP_NAV_TO_EXT':
                    oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
                    const hash = (oCrossAppNavigator.hrefForExternal({
                        target: args[1],
                        params: args[2]
                    })) || "";
                    if (args[3] === 'EXT') {
                        let url = window.location.href.split('#')[0] + hash;
                        sap.m.URLHelper.redirect(url, true);
                    } else {
                        oCrossAppNavigator.toExternal({
                            target: {
                                shellHash: hash
                            }
                        });
                    }
                    break;
                case 'LOCATION_RELOAD':
                    window.location = args[1];
                    break;
                case 'OPEN_NEW_TAB':
                    window.open(args[1], '_blank');
                    break;
                case 'POPUP_CLOSE':
                    sap.z2ui5.oController.PopupDestroy();
                    break;
                case 'POPOVER_CLOSE':
                    sap.z2ui5.oController.PopoverDestroy();
                    break;
                case 'NAV_CONTAINER_TO':
                    let navCon = sap.z2ui5.oView.byId(args[1]);
                    let navConTo = sap.z2ui5.oView.byId(args[2]);
                    navCon.to(navConTo);
                    break;
                case 'NEST_NAV_CONTAINER_TO':
                    navCon = sap.z2ui5.oViewNest.byId(args[1]);
                    navConTo = sap.z2ui5.oViewNest.byId(args[2]);
                    navCon.to(navConTo);
                    break;
                case 'NEST2_NAV_CONTAINER_TO':
                    navCon = sap.z2ui5.oViewNest2.byId(args[1]);
                    navConTo = sap.z2ui5.oViewNest.byId(args[2]);
                    navCon.to(navConTo);
                    break;
            }
        }
        ,

        onEvent(...args) {
            if (sap.z2ui5.isBusy) {
                if (sap.z2ui5.isBusy == true) {
                    sap.z2ui5.busyDialog = new sap.m.BusyDialog();
                    sap.z2ui5.busyDialog.open();
                    return;
                }
            }
            sap.z2ui5.isBusy = true;
            if (!window.navigator.onLine) {
                sap.m.MessageBox.alert('No internet connection! Please reconnect to the server and try again.');
                sap.z2ui5.isBusy = false;
                return;
            }
            sap.ui.core.BusyIndicator.show();
            sap.z2ui5.oBody = {};
            let isUpdated = false;
            if (sap.z2ui5.oViewPopup) {
                if (!sap.z2ui5.oViewPopup.isOpen || sap.z2ui5.oViewPopup.isOpen() == true) {
                    sap.z2ui5.oBody.EDIT = sap.z2ui5.oViewPopup.getModel().getData().EDIT;
                    isUpdated = true;
                    sap.z2ui5.oBody.VIEWNAME = 'MAIN';
                }
            }
            if (isUpdated == false) {
                if (sap.z2ui5.oViewPopover) {
                    if (sap.z2ui5.oViewPopover.isOpen) {
                        if (sap.z2ui5.oViewPopover.isOpen() == true) {
                            sap.z2ui5.oBody.EDIT = sap.z2ui5.oViewPopover.getModel().getData().EDIT;
                            isUpdated = true;
                            sap.z2ui5.oBody.VIEWNAME = 'MAIN';
                        }
                    }
                    sap.z2ui5.oViewPopover.destroy();
                }
            }
            if (isUpdated == false) {
                if (sap.z2ui5.oViewNest == this.getView()) {
                    sap.z2ui5.oBody.EDIT = sap.z2ui5.oViewNest.getModel().getData().EDIT;
                    sap.z2ui5.oBody.VIEWNAME = 'NEST';
                    isUpdated = true;
                }
            }
            if (isUpdated == false) {
                sap.z2ui5.oBody.EDIT = sap.z2ui5.oView.getModel().getData().EDIT;
                sap.z2ui5.oBody.VIEWNAME = 'MAIN';
            }

            sap.z2ui5.onBeforeRoundtrip.forEach(item => {
                if (item !== undefined) {
                    item();
                }
            }
            )
            if (args[0].CHECK_VIEW_DESTROY) {
                sap.z2ui5.oController.ViewDestroy();
            }
            sap.z2ui5.oBody.ID = sap.z2ui5.oResponse.ID;
            sap.z2ui5.oBody.ARGUMENTS = args;

            if (sap.z2ui5.checkLogActive) {
                console.log('Request Object:');
                console.log(sap.z2ui5.oBody);
            }
            sap.z2ui5.oResponseOld = sap.z2ui5.oResponse;
            sap.z2ui5.oResponse = {};
            sap.z2ui5.oController.Roundtrip();
        },
        responseError(response) {
            document.write(response);
        },
        updateModelIfRequired(paramKey, oView) {
            if (sap.z2ui5.oResponse.PARAMS[paramKey].CHECK_UPDATE_MODEL) {
                let model = new sap.ui.model.json.JSONModel(sap.z2ui5.oResponse.OVIEWMODEL);
                model.setSizeLimit(sap.z2ui5.JSON_MODEL_LIMIT);
                oView.setModel(model);
            }
        },
        responseSuccess(response) {
            sap.z2ui5.oResponse = response;

            // Log response if logging is active
            if (sap.z2ui5.checkLogActive) {
                sap.z2ui5.oController.logResponse();
            }

            // Handle view destroy
            if (sap.z2ui5.oResponse.PARAMS.S_VIEW.CHECK_DESTROY) {
                sap.z2ui5.oController.ViewDestroy();
            }

            // Create new view if XML is provided
            if (sap.z2ui5.oResponse.PARAMS.S_VIEW.XML !== '') {
                sap.z2ui5.oController.ViewDestroy();
                sap.z2ui5.oController.createView(sap.z2ui5.oResponse.PARAMS.S_VIEW.XML, sap.z2ui5.oResponse.OVIEWMODEL);
            } else {
                // Update models if needed
                this.updateModelIfRequired('S_VIEW', sap.z2ui5.oView);
                this.updateModelIfRequired('S_VIEW_NEST', sap.z2ui5.oViewNest);
                this.updateModelIfRequired('S_VIEW_NEST2', sap.z2ui5.oViewNest2);
                this.updateModelIfRequired('S_POPUP', sap.z2ui5.oViewPopup);
                this.updateModelIfRequired('S_POPOVER', sap.z2ui5.oViewPopover);

                sap.z2ui5.oController.onAfterRendering();
            }

            // Show message toasts and message boxes
            sap.z2ui5.oController.showMessage('S_MSG_TOAST', sap.z2ui5.oResponse.PARAMS);
            sap.z2ui5.oController.showMessage('S_MSG_BOX', sap.z2ui5.oResponse.PARAMS);
        },
        showMessage(msgType, params) {
            if (params[msgType].TEXT !== '') {
                if (msgType === 'S_MSG_TOAST') {
                    sap.m.MessageToast.show(params[msgType].TEXT);
                } else if (msgType === 'S_MSG_BOX') {
                    sap.m.MessageBox[params[msgType].TYPE](params[msgType].TEXT);
                }
            }
        },
        logResponse() {

            console.log('Response Object:', sap.z2ui5.oResponse);

            // Destructure for easier access
            const { S_VIEW, S_POPUP, S_POPOVER, S_VIEW_NEST, S_VIEW_NEST2 } = sap.z2ui5.oResponse.PARAMS;

            // Helper function to log XML
            const logXML = (label, xml) => {
                if (xml !== '') {
                    console.log(`${label}:`, xml);
                }
            };

            // Log different XML responses
            logXML('UI5-XML-View', S_VIEW.XML);
            logXML('UI5-XML-Popup', S_POPUP.XML);
            logXML('UI5-XML-Popover', S_POPOVER.XML);
            logXML('UI5-XML-Nest', S_VIEW_NEST.XML);
            logXML('UI5-XML-Nest2', S_VIEW_NEST2.XML);

        },
        async createView(xml, viewModel) {
            try {
                const oView = await sap.ui.core.mvc.XMLView.create({
                    definition: xml,
                    controller: sap.z2ui5.oController,
                });

                let oview_model = new sap.ui.model.json.JSONModel(viewModel);
                oview_model.setSizeLimit(sap.z2ui5.JSON_MODEL_LIMIT);
                oView.setModel(oview_model);

                if (sap.z2ui5.oParent) {
                    sap.z2ui5.oParent.removeAllPages();
                    sap.z2ui5.oParent.insertPage(oView);
                } else {
                    oView.placeAt("content");
                }
                sap.ui.getCore().getMessageManager().registerObject(oView, true);
                sap.z2ui5.oView = oView;
            } catch (e) {
                sap.m.MessageBox.error('Error while creating View - ' + e.message);
            }
        },
        async readHttp() {
            const response = await fetch(sap.z2ui5.pathname, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sap.z2ui5.oBody)
            });

            if (!response.ok) {
                const responseText = await response.text();
                sap.z2ui5.oController.responseError(responseText);
            } else {
                const responseData = await response.json();
                sap.z2ui5.oController.responseSuccess(responseData);
            }

        },

        Roundtrip() {

            sap.z2ui5.checkTimerActive = false;
            sap.z2ui5.checkNestAfter = false;
            sap.z2ui5.checkNestAfter2 = false;

            sap.z2ui5.oBody.OLOCATION = {
                ORIGIN: window.location.origin,
                PATHNAME: sap.z2ui5.pathname,
                SEARCH: window.location.search,
                VERSION: sap.ui.getVersionInfo().gav,
                CHECK_LAUNCHPAD_ACTIVE: sap.ushell !== undefined,
                STARTUP_PARAMETERS: sap.z2ui5.startupParameters,
            };
            if (sap.z2ui5.search) {
                sap.z2ui5.oBody.OLOCATION.SEARCH = sap.z2ui5.search;
            }

            if (sap.z2ui5.readOData) {
                sap.z2ui5.readOData();
            } else {
                sap.z2ui5.oController.readHttp();
            }
        }
        ,
    });

    // Ensure sap.z2ui5 namespace exists and initialize properties
    sap.z2ui5 = sap.z2ui5 || {};
    sap.z2ui5.pathname = sap.z2ui5.pathname || '/sap/test';
    sap.z2ui5.checkNestAfter = false;

    // Require necessary SAP UI5 modules
    jQuery.sap.require("sap.ui.core.Fragment");
    jQuery.sap.require("sap.m.MessageToast");
    jQuery.sap.require("sap.m.MessageBox");
    jQuery.sap.require("sap.ui.model.json.JSONModel");

    // Create views and controllers
    const xml = atob('PA==') + 'mvc:View controllerName="z2ui5_controller" xmlns:mvc="sap.ui.core.mvc" /' + atob('Pg==');
    const createViewAndController = (xmlContent) => {
        const view = sap.ui.xmlview({ viewContent: xmlContent });
        return { view, controller: view.getController() };
    };

    const { controller: oController } = createViewAndController(xml);
    const { controller: oControllerNest } = createViewAndController(xml);
    const { controller: oControllerNest2 } = createViewAndController(xml);

    sap.z2ui5.oController = oController;
    sap.z2ui5.oControllerNest = oControllerNest;
    sap.z2ui5.oControllerNest2 = oControllerNest2;

    // Helper functions
    jQuery.sap.declare("sap.z2ui5.Helper");
    sap.z2ui5.Helper = {
        DateCreateObject: (s) => new Date(s),
        DateAbapTimestampToDate: (sTimestamp) => new sap.gantt.misc.Format.abapTimestampToDate(sTimestamp),
        DateAbapDateToDateObject: (d) => new Date(d.slice(0, 4), parseInt(d.slice(4, 6)) - 1, d.slice(6, 8)),
        DateAbapDateTimeToDateObject: (d, t = '000000') => new Date(d.slice(0, 4), parseInt(d.slice(4, 6)) - 1, d.slice(6, 8), t.slice(0, 2), t.slice(2, 4), t.slice(4, 6))
    };

    // Initialize other properties
    sap.z2ui5.oBody = { APP_START: sap.z2ui5.APP_START };
    sap.z2ui5.oController.Roundtrip();
    
    sap.z2ui5.onBeforeRoundtrip = [];
    sap.z2ui5.onBeforeEventFrontend = [];
    
    sap.z2ui5.JSON_MODEL_LIMIT = 100;
    sap.z2ui5.checkLogActive = true;
    

});
