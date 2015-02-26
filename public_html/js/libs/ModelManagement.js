/*
 * Copyright (c) 2013-2015 Dassault Systemes. All rights reserved.
 */
/*jslint indent: 4, vars: true, plusplus: true, sloppy: true, browser: true, devel: true, nomen: true */
/*global $, escape: true */

/**
 * @param {Boolean} regressionTesting Regression testing.
 * @param {Boolean} classCov Class coverage.
 * @param {Boolean} condCov Condition coverage.
 * @param {Boolean} styleCheck Style checking.
 * @param {String} name Name of model or package to be checked.
 * @param {String} testFileDirectory Additional test cases for regression and coverage (optional).
 * @param {Boolean} generateReference Generate reference files.
 * @param {String} referenceFileDirectory Path to directory of reference files (optional).
 * @param {Boolean} filter Filter animate/animation/visualize.
 * @param {Boolean} localCoverage Include only main package classes.
 * @param {Object} setup 
 * @param {Boolean} outputOk Include successful checks in log file.
 * @param {Boolean} ShowPlots Include plots of regression test differences.
 * @param {Boolean} translationStructure Translation statistics.
 * @param {Boolean} generateReferenceTranslationStructure Generate reference translation structure.
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Check_checkLibrary = function (regressionTesting, classCov, condCov, styleCheck, name, testFileDirectory, generateReference, referenceFileDirectory, filter, localCoverage, setup, outputOk, ShowPlots, translationStructure, generateReferenceTranslationStructure) {
    var params = [];
    params.push(regressionTesting);
    params.push(classCov);
    params.push(condCov);
    params.push(styleCheck);
    params.push(name);
    params.push(testFileDirectory);
    params.push(generateReference);
    params.push(referenceFileDirectory);
    params.push(filter);
    params.push(localCoverage);
    params.push(setup);
    params.push(outputOk);
    params.push(ShowPlots);
    params.push(translationStructure);
    params.push(generateReferenceTranslationStructure);
    this.callDymolaFunction("ModelManagement.Check.checkLibrary", params);
};

/**
 * @param {String} packageName1 Class name.
 * @param {String} pseudonym1 Pseudonym.
 * @param {String} packageName2 Class name.
 * @param {String} pseudonym2 Pseudonym.
 * @param {String} HTMLFileName HTML file.
 * @param {Boolean} compareEquation Compare equations.
 * @param {Boolean} documentation Compare documentation.
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Compare_compareModels = function (packageName1, pseudonym1, packageName2, pseudonym2, HTMLFileName, compareEquation, documentation) {
    var params = [];
    params.push(packageName1);
    params.push(pseudonym1);
    params.push(packageName2);
    params.push(pseudonym2);
    params.push(HTMLFileName);
    params.push(compareEquation);
    params.push(documentation);
    this.callDymolaFunction("ModelManagement.Compare.compareModels", params);
};

/**
 * @param {String} s 
 * @returns {Array} nr
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_Examples_countModelsInPackage = function (s) {
    var params = [];
    params.push(s);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.Examples.countModelsInPackage", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * @param {String} s 
 * @returns {Array} packs
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_Examples_givePackagesInPackage = function (s) {
    var params = [];
    params.push(s);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.Examples.givePackagesInPackage", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * @param {String} s 
 * @returns {Array} attr
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_Examples_attributeModelsInPackage = function (s) {
    var params = [];
    params.push(s);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.Examples.attributeModelsInPackage", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * @returns {String} is
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_ClassShownInBrowser = function () {
    var params = [];
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.ClassShownInBrowser", params);
    return this.parseResponseAndReturn(result, "String");
};

/**
 * @returns {String} compPath (String), classOfComponent (String)
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_ComponentShownInBrowser = function () {
    var params = [];
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.ComponentShownInBrowser", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * @returns {Array} compNames (Array), classesOfComponents (Array)
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_ComponentsHighlightedInDiagram = function () {
    var params = [];
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.ComponentsHighlightedInDiagram", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * @param {String} className 
 * @param {String} [fileName=""]  Default "".
 * @returns {Array} localClasses
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_ClassesInPackage = function (className, fileName) {
    fileName = (fileName === undefined) ? "" : fileName;
    var params = [];
    params.push(className);
    params.push(fileName);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.ClassesInPackage", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * @param {String} className 
 * @param {String} [fileName=""]  Default "".
 * @returns {Array} localClasses
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_ClassesInPackageAttributes = function (className, fileName) {
    fileName = (fileName === undefined) ? "" : fileName;
    var params = [];
    params.push(className);
    params.push(fileName);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.ClassesInPackageAttributes", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * @param {String} fullName 
 * @returns {Object} attributes
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_GetClassAttributes = function (fullName) {
    var params = [];
    params.push(fullName);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.GetClassAttributes", params);
    return this.parseResponseAndReturn(result, "Object");
};

/**
 * @param {String} fullName 
 * @param {Boolean} [includeAnnotations=false]  Default false.
 * @param {Boolean} [formatted=false]  Default false.
 * @returns {String} prettyPrinted
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_GetClassText = function (fullName, includeAnnotations, formatted) {
    includeAnnotations = (includeAnnotations === undefined) ? false : includeAnnotations;
    formatted = (formatted === undefined) ? false : formatted;
    var params = [];
    params.push(fullName);
    params.push(includeAnnotations);
    params.push(formatted);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.GetClassText", params);
    return this.parseResponseAndReturn(result, "String");
};

/**
 * @param {String} className 
 * @returns {Array} components
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_ComponentsInClass = function (className) {
    var params = [];
    params.push(className);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.ComponentsInClass", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * @param {String} className 
 * @returns {Array} localComponents
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_ComponentsInClassAttributes = function (className) {
    var params = [];
    params.push(className);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.ComponentsInClassAttributes", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * @param {String} className 
 * @param {String} componentName 
 * @returns {Object} attributes
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_GetComponentAttributes = function (className, componentName) {
    var params = [];
    params.push(className);
    params.push(componentName);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.GetComponentAttributes", params);
    return this.parseResponseAndReturn(result, "Object");
};

/**
 * @param {String} fullName 
 * @param {String} componentName 
 * @param {Boolean} [includeAnnotations=false]  Default false.
 * @returns {String} prettyPrinted
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_GetComponentText = function (fullName, componentName, includeAnnotations) {
    includeAnnotations = (includeAnnotations === undefined) ? false : includeAnnotations;
    var params = [];
    params.push(fullName);
    params.push(componentName);
    params.push(includeAnnotations);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.GetComponentText", params);
    return this.parseResponseAndReturn(result, "String");
};

/**
 * @param {String} fullName 
 * @param {String} componentName 
 * @returns {Array} modifiers
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_ComponentModifiers = function (fullName, componentName) {
    var params = [];
    params.push(fullName);
    params.push(componentName);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.ComponentModifiers", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * @param {String} className 
 * @returns {Array} components
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_ExtendsInClass = function (className) {
    var params = [];
    params.push(className);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.ExtendsInClass", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * @param {String} className 
 * @returns {Array} localExtends
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_ExtendsInClassAttributes = function (className) {
    var params = [];
    params.push(className);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.ExtendsInClassAttributes", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * @param {String} fullName 
 * @param {String} componentName 
 * @returns {Array} modifiers
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_ExtendsModifiers = function (fullName, componentName) {
    var params = [];
    params.push(fullName);
    params.push(componentName);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.ExtendsModifiers", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * @param {String} className 
 * @param {String} extendsName 
 * @returns {Object} attributes
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_GetExtendsAttributes = function (className, extendsName) {
    var params = [];
    params.push(className);
    params.push(extendsName);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.GetExtendsAttributes", params);
    return this.parseResponseAndReturn(result, "Object");
};

/**
 * @param {String} className 
 * @returns {Array} imports
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_ImportsInClassAttributes = function (className) {
    var params = [];
    params.push(className);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.ImportsInClassAttributes", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * <html><p>Function to erase the given models. It requires that no models outside of this list depend on them. This is not primarily an interactive function, but designed to be called by other controlling and changing models. Corresponds to <b>Delete</b> in the Package Browser.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <pre>eraseClasses({&QUOT;model1&QUOT;,&QUOT;PackageA.model2&QUOT;})</pre>
 * <p>will erase the listed models from the Package Browser.</p></html>
 *
 * @param {Array} classnames_ List of classes to erase. Dimension [:].
 * @returns {Boolean} true if successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_EraseClasses = function (classnames_) {
    var params = [];
    params.push(classnames_);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.EraseClasses", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * @param {String} fullName 
 * @returns {Boolean} exists
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_ClassExists = function (fullName) {
    var params = [];
    params.push(fullName);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.ClassExists", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * @param {String} fileName 
 * @returns {Boolean} ok
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_ReadModelicaFile = function (fileName) {
    var params = [];
    params.push(fileName);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.ReadModelicaFile", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>This function corresponds to <b>File &GT; Save Total ...</b>.</p>
 * <p>It saves a model and its dependencies (from non-encrypted libraries) as a modelica package for easy distribution.</p></html>
 *
 * @param {String} fileName File to store in (remember: Modelica string quoting).
 * @param {String} modelName Top-level model.
 * @returns {Boolean} True if succesful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_SaveTotalModel = function (fileName, modelName) {
    var params = [];
    params.push(fileName);
    params.push(modelName);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.SaveTotalModel", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * @param {String} fileName 
 * @param {String} className 
 * @returns {Boolean} ok
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_SaveModel = function (fileName, className) {
    var params = [];
    params.push(fileName);
    params.push(className);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.SaveModel", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * @param {String} oldClassName 
 * @param {String} newClassName 
 * @returns {Boolean} ok
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_CopyClass = function (oldClassName, newClassName) {
    var params = [];
    params.push(oldClassName);
    params.push(newClassName);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.CopyClass", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * @param {String} oldClassName 
 * @param {String} newClassName 
 * @returns {Boolean} ok
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_MoveClass = function (oldClassName, newClassName) {
    var params = [];
    params.push(oldClassName);
    params.push(newClassName);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.MoveClass", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * @param {String} fullName 
 * @param {Boolean} [includeAnnotations=false]  Default false.
 * @returns {Array} equations
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_EquationBlocks = function (fullName, includeAnnotations) {
    includeAnnotations = (includeAnnotations === undefined) ? false : includeAnnotations;
    var params = [];
    params.push(fullName);
    params.push(includeAnnotations);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.EquationBlocks", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * @param {String} fullName 
 * @param {Boolean} [includeAnnotations=false]  Default false.
 * @returns {Array} equations
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_Connections = function (fullName, includeAnnotations) {
    includeAnnotations = (includeAnnotations === undefined) ? false : includeAnnotations;
    var params = [];
    params.push(fullName);
    params.push(includeAnnotations);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.Connections", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * @param {String} className 
 * @param {String} [annotationName=""] Optional hiearchical name using dot-notation. Default "".
 * @param {String} [componentName=""] Optional name of local component. Default "".
 * @returns {String} annot
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_GetAnnotation = function (className, annotationName, componentName) {
    annotationName = (annotationName === undefined) ? "" : annotationName;
    componentName = (componentName === undefined) ? "" : componentName;
    var params = [];
    params.push(className);
    params.push(annotationName);
    params.push(componentName);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.GetAnnotation", params);
    return this.parseResponseAndReturn(result, "String");
};

/**
 * @param {String} className 
 * @param {String} annotationName Hiearchical name using dot-notation.
 * @param {String} [componentName=""] Optional name of local component. Default "".
 * @returns {String} annot
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_AST_GetAnnotationString = function (className, annotationName, componentName) {
    componentName = (componentName === undefined) ? "" : componentName;
    var params = [];
    params.push(className);
    params.push(annotationName);
    params.push(componentName);
    var result = this.callDymolaFunction("ModelManagement.Structure.AST.GetAnnotationString", params);
    return this.parseResponseAndReturn(result, "String");
};

/**
 * @param {String} s 
 * @returns {Array} used
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_Instantiated_Examples_PresentExampleUse = function (s) {
    var params = [];
    params.push(s);
    var result = this.callDymolaFunction("ModelManagement.Structure.Instantiated.Examples.PresentExampleUse", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * @param {String} s 
 * @param {Array} submodels  Dimension [:].
 * @returns {Array} count
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_Instantiated_Examples_CollectUsedInPackage = function (s, submodels) {
    var params = [];
    params.push(s);
    params.push(submodels);
    var result = this.callDymolaFunction("ModelManagement.Structure.Instantiated.Examples.CollectUsedInPackage", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * @param {String} s 
 * @returns {Array} models
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_Instantiated_Examples_Utilities_CollectModelsIn = function (s) {
    var params = [];
    params.push(s);
    var result = this.callDymolaFunction("ModelManagement.Structure.Instantiated.Examples.Utilities.CollectModelsIn", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * @param {String} Model 
 * @returns {Number} nrEquations
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_Instantiated_NrEquations = function (Model) {
    var params = [];
    params.push(Model);
    var result = this.callDymolaFunction("ModelManagement.Structure.Instantiated.NrEquations", params);
    return this.parseResponseAndReturn(result, "Number");
};

/**
 * @param {String} Model 
 * @returns {Number} nrUnknowns
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_Instantiated_NrUnknowns = function (Model) {
    var params = [];
    params.push(Model);
    var result = this.callDymolaFunction("ModelManagement.Structure.Instantiated.NrUnknowns", params);
    return this.parseResponseAndReturn(result, "Number");
};

/**
 * @param {String} Model 
 * @returns {Array} possibleStates
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_Instantiated_ListPossibleContinuousStates = function (Model) {
    var params = [];
    params.push(Model);
    var result = this.callDymolaFunction("ModelManagement.Structure.Instantiated.ListPossibleContinuousStates", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * @param {String} Model 
 * @returns {Array} possibleStates
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_Instantiated_ListPossibleDiscreteStates = function (Model) {
    var params = [];
    params.push(Model);
    var result = this.callDymolaFunction("ModelManagement.Structure.Instantiated.ListPossibleDiscreteStates", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * @param {String} Model 
 * @returns {Array} used
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_Instantiated_UsedModels = function (Model) {
    var params = [];
    params.push(Model);
    var result = this.callDymolaFunction("ModelManagement.Structure.Instantiated.UsedModels", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * @param {String} Model 
 * @param {Array} submodels  Dimension [:].
 * @returns {Array} used
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ModelManagement_Structure_Instantiated_CountUsedModels = function (Model, submodels) {
    var params = [];
    params.push(Model);
    params.push(submodels);
    var result = this.callDymolaFunction("ModelManagement.Structure.Instantiated.CountUsedModels", params);
    return this.parseResponseAndReturn(result, "Array");
};

