/*
 * Copyright (c) 2013-2014 Dassault Systemes. All rights reserved.
 */
/*jslint indent: 4, vars: true, plusplus: true, sloppy: true, browser: true, devel: true, nomen: true */
/*global escape: true */

DymolaInterface.prototype.Dymola_AST_GetAnnotation = function (className, annotationName, componentName) {
    annotationName = (annotationName === undefined) ? "" : annotationName;
    componentName = (componentName === undefined) ? "" : componentName;
    var params = [];
    params.push(className);
    params.push(annotationName);
    params.push(componentName);
    var result = this.callDymolaFunction("Dymola_AST_GetAnnotation", params);
    return this.parseResponseAndReturn(result, "Object");
};

DymolaInterface.prototype.Dymola_AST_ComponentsInClass = function (className) {
    var params = [];
    params.push(className);
    var result = this.callDymolaFunction("Dymola_AST_ComponentsInClass", params);
    return this.parseResponseAndReturn(result, "Array");
};

DymolaInterface.prototype.Dymola_AST_ComponentIsGraphical = function (fullName, componentName) {
    var params = [];
    params.push(fullName);
    params.push(componentName);
    var result = this.callDymolaFunction("Dymola_AST_ComponentIsGraphical", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

DymolaInterface.prototype.Dymola_AST_ComponentFullTypeName = function (fullName, componentName) {
    var params = [];
    params.push(fullName);
    params.push(componentName);
    var result = this.callDymolaFunction("Dymola_AST_ComponentFullTypeName", params);
    return this.parseResponseAndReturn(result, "String");
};

DymolaInterface.prototype.Dymola_AST_ClassesInPackageWithProperties = function (className) {
    var params = [];
    params.push(className);
    var result = this.callDymolaFunction("Dymola_AST_ClassesInPackageWithProperties", params);
    return this.parseResponseAndReturn(result, "Array");
};

DymolaInterface.prototype.exportWebGL = function (className, iconLayer) {
    iconLayer = (iconLayer === undefined) ? true : iconLayer;
    var params = [];
    params.push(className);
    params.push(iconLayer);
    var result = this.callDymolaFunction("exportWebGL", params);
    return this.parseResponseAndReturn(result, "String");
};
