/*
 * Copyright (c) 2013-2014 Dassault Systemes. All rights reserved.
 */
/*jslint indent: 4, vars: true, plusplus: true, sloppy: true, browser: true, devel: true, nomen: true */
/*global $, escape: true */

/**
 * Dymola enumeration used by at least one interface function.
 * @enum {number}
 */
var LinePattern = {
    None : 1,
    Solid : 2,
    Dash : 3,
    Dot : 4,
    DashDot : 5,
    DashDotDot : 6
};

/**
 * Dymola enumeration used by at least one interface function.
 * @enum {number}
 */
var MarkerStyle = {
    None : 1,
    Cross : 2,
    Circle : 3,
    Square : 4,
    FilledCircle : 5,
    FilledSquare : 6,
    TriangleDown : 7,
    TriangleUp : 8,
    Diamond : 9,
    Dot : 10,
    SmallSquare : 11,
    Point : 12
};

/**
 * Dymola enumeration used by at least one interface function.
 * @enum {number}
 */
var TextStyle = {
    Bold : 1,
    Italic : 2,
    UnderLine : 3
};

/**
 * Dymola enumeration used by at least one interface function.
 * @enum {number}
 */
var TextAlignment = {
    Left : 1,
    Center : 2,
    Right : 3
};

/**
 * Dymola enumeration used by at least one interface function.
 * @enum {number}
 */
var SignalOperator = {
    Min : 1,
    Max : 2,
    ArithmeticMean : 3,
    RectifiedMean : 4,
    RMS : 5,
    ACCoupledRMS : 6,
    SlewRate : 7,
    THD : 8,
    FirstHarmonic : 9
};

/**
 * @private
 */
function getObjectTypeName(obj) {
    if (obj === undefined || obj === null) {
        return "null";
    }
    var funcNameRegex = /function ([\w\W]{1,})\(/;
    var results = funcNameRegex.exec(obj.constructor.toString());
    return (results && results.length > 1) ? results[1] : "";
}

/**
 * @private
 */
String.prototype.startsWith = function (s) {
    return this.indexOf(s) === 0;
};

/**
 * The version of Dymola that this interface is compatible with.
 */
var dymola_version = 2016;

/**
 * @private
 */
function DymolaUnquotedString(s) {
    this.value = s;
}

/**
 * @private
 */
function DymolaNamedArgument(name, value) {
    this.named_argument = name;
    this.named_value = value;
}

/**
 * @private
 */
function fixJsonParameter(item) {
    var result = "";
    if (item instanceof DymolaNamedArgument) {
        var value = fixJsonParameter(item.named_value);
        if (getObjectTypeName(value) === "String") {
            value = value.replace(/\"%22/g, "%22");
            value = value.replace(/%22\"/g, "%22");
            var tokens = value.split("%22");
            value = "";
            var first = true;
            var outside_string = true;
            var i, token;
            for (i = 0; i < tokens.length; i++) {
                token = tokens[i];
                if (!first) {
                    value += "%22";
                }
                if (outside_string) {
                    token = token.replace(/\[/g, "{");
                    token = token.replace(/\]/g, "}");
                }
                value += token;
                first = false;
                outside_string = !outside_string;
            }
        }
        result = "\"" + item.named_argument + "=" + value + "\"";
    } else if (item instanceof DymolaUnquotedString) {
        result = "\"" + item.value + "\"";
    } else if (typeof item === "string" || item instanceof String) {
        result = "\"%22" + escape(item) + "%22\"";
    } else if (item instanceof Array) {
        result = fixJsonParameterList(item);
    } else {
        result = item;
    }
    return result;
}

/**
 * @private
 */
function fixJsonParameterList(params) {
    var result = "";
    if (params === null) {
        result = "null";
    } else {
        result = "[";
        var i;
        for (i = 0; i < params.length; i++) {
            if (i > 0) {
                result += ", ";
            }
            result += fixJsonParameter(params[i]);
        }
        result += "]";
    }
    return result;
}

/**
 * Creates an instance of DymolaInterface.
 *
 * @param {number} port The port number to use for connecting to Dymola. Default is 8082.
 * @class
 * @classdesc
 * This class provides a JavaScript API for accessing the most useful built-in functions in Dymola.
 * The API is compatible with <b>Dymola 2015 FD01 Early Access</b>.
 * <p>
 * In order to use the JavaScript interface you need to run Dymola with the command-line option <code>-serverport 8082.</code>
 * <p>
 * There is a one-to-one correspondence between the parameters in a Dymola command and the parameters in the
 * corresponding JavaScript method. Note that JavaScript does not support named parameters.
 * <p>
 * If you want to execute a command that is not part of the Java interface, you can use the method ExecuteCommand.
 * It takes a string parameter that can contain any command or expression. For example:
 * <p>
 * <code>dymola.ExecuteCommand("a=1");</code>
 * <p>
 * The command is not type checked so you are responsible for making sure that the command is valid. It is not
 * possible to retrieve the output from the command.
 * <p>
 * An example of how to use the JavaScript interface is shown below.
 * @example
 * try {
 *      var dymola = new DymolaInterface();
 *      var result = dymola.simulateModel("Modelica.Mechanics.Rotational.Examples.CoupledClutches");
 *      if (result) {
 *           result = dymola.plot(["J1.w", "J2.w", "J3.w", "J4.w"]);
 *           if (result) {
 *                 result = dymola.ExportPlotAsImage("C:/temp/plot.png");
 *           }
 *      } else {
 *           alert("Simulation failed.");
 *           var log = dymola.getLastError();
 *           alert(log);
 *      }
 * } catch (e) {
 *      alert("Exception: " + e);
 * }
 */
function DymolaInterface(_port, _hostname) {
    _port = (_port === undefined) ? 8082 : _port;
    _hostname = (_hostname === undefined) ? "127.0.0.1" : _hostname;
    this.port = _port;
    this.hostname = _hostname;
    this.rpc_id = 0;
    this.is_offline = !this.isDymolaRunning();
    if (!this.is_offline) {
        var version = this.DymolaVersionNumber();
        if (version !== dymola_version) {
            throw "Mismatching Dymola version. Java interface version supports " + dymola_version + " but Dymola was " + version + ".";
        }
    }
}

/**
 * @private
 */
DymolaInterface.prototype.callDymolaFunction = function (cmd, params) {
    try {
        if (this.is_offline) {
            return null;
        }
        this.rpc_id++;
        var request = "{\"method\": \"" + cmd + "\", \"params\": " + fixJsonParameterList(params) + ", \"id\": " + this.rpc_id + "}\n";
        var ajax;
        var response;
        var i = 0;
        do {
            ajax = $.ajax({
                type: "POST",
                url: "http://" + this.hostname + ":" + this.port,
                data: request,
                async: false
            });
            response = ajax.responseText;
        } while (response === undefined && ++i < 10);
        var obj = null;
        try {
            obj = JSON.parse(response);
        } catch (e) {
            obj = null;
        }
        if (obj) {
            var error = obj.error;
            if (error === null) {
                return obj.result;
            }
        }
    } catch (e) {
        alert("Exception: " + e);
    }
    return null;
};

/**
 * @private
 */
DymolaInterface.prototype.parseResponseAndReturn = function (result, expectedType) {
    if (this.is_offline) {
        return null;
    }
    var resultType = getObjectTypeName(result);
    if (resultType === expectedType) {
        return result;
    }
    alert("ERROR: Bad return type. Expected " + expectedType + " but got " + resultType + ".\n\n" + result);
    return null;
};

/**
 * @private
 */
DymolaInterface.prototype.isOfflineMode = function () {
    return this.is_offline;
};

/**
 * @private
 */
DymolaInterface.prototype.setOfflineMode = function (enable) {
    this.is_offline = enable;
};

/**
 * @private
 */
DymolaInterface.prototype.isDymolaRunning = function () {
    var result = false;
    try {
        this.rpc_id++;
        var request = "{\"method\": \"ping\", \"params\": null, \"id\": " + this.rpc_id + "}\n";
        var ajax;
        var i = 0;
        do {
            ajax = $.ajax({
                type: "POST",
                url: "http://" + this.hostname + ":" + this.port,
                data: request,
                async: false
            });
            result = (ajax.responseText !== undefined);
        } while (!result && ++i < 10);
    } catch (ignore) {
    }
    return result;
};

/**
 * Executes a command in the scripting window. Use this method if you want to execute
 * a command that is not part of the JavaScript interface. It takes a string parameter that can
 * contain any command or expression. For example:
 *
 *     dymola.ExecuteCommand("a=1")
 *
 * The command is not type checked so you are responsible for making sure that the
 * command is valid. It is not possible to retrieve the output from the command. If the
 * command failed to execute the error message can be retrieved using getLastError.
 *
 * @param {string} cmd The command to execute.
 * @returns {boolean} result
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ExecuteCommand = function (cmd) {
    return this.callDymolaFunction(cmd, null);
};

/**
 * <html><p>The function lists the current animation setup in the Commands window. An example is provided below.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <pre>animationSetup();
 * animationRemove(id&nbsp;=&nbsp;1);
 * animationPosition(position={20,50,490,370},id=1);
 * animationGrid(grid_square&nbsp;=&nbsp;1.0,&nbsp;grid_size&nbsp;=&nbsp;50.0);
 * animationView(view&nbsp;=&nbsp;
 * [1.0,&nbsp;0.0,&nbsp;0.0,&nbsp;0.0;
 * 0.0,&nbsp;1.0,&nbsp;0.0,&nbsp;0.0;
 * 0.0,&nbsp;0.0,&nbsp;1.0,&nbsp;0.0;
 * 0.0,&nbsp;0.0,&nbsp;0.0,&nbsp;1.0]);
 * animationFollow(followFirst&nbsp;=&nbsp;false,&nbsp;followX&nbsp;=&nbsp;true,&nbsp;followY&nbsp;=&nbsp;true,&nbsp;followZ&nbsp;=&nbsp;false,&nbsp;followRotation&nbsp;=&nbsp;false);
 * animationViewing(cylinder&nbsp;=&nbsp;false,&nbsp;fillmode&nbsp;=&nbsp;false,&nbsp;unitcube&nbsp;=&nbsp;false,&nbsp;xygrid&nbsp;=&nbsp;false,&nbsp;xzgrid&nbsp;=&nbsp;false,&nbsp;yzgrid&nbsp;=&nbsp;false,&nbsp;perspective&nbsp;=&nbsp;false,&nbsp;antialias&nbsp;=&nbsp;false,&nbsp;continuously&nbsp;=&nbsp;false,&nbsp;axisreference&nbsp;=&nbsp;false,&nbsp;traceall&nbsp;=&nbsp;false);
 * animationSelected(name&nbsp;=&nbsp;true,&nbsp;highlight&nbsp;=&nbsp;true,&nbsp;follow&nbsp;=&nbsp;false,&nbsp;trace&nbsp;=&nbsp;true,&nbsp;selectedName&nbsp;=&nbsp;&QUOT;&QUOT;);
 * animationFrames(history&nbsp;=&nbsp;0,&nbsp;interval&nbsp;=&nbsp;1,&nbsp;delays&nbsp;=&nbsp;0);
 * animationColor(background&nbsp;=&nbsp;{0.75,&nbsp;0.75,&nbsp;0.75},&nbsp;selected&nbsp;=&nbsp;{1.0,&nbsp;0.0,&nbsp;0.0},&nbsp;grid&nbsp;=&nbsp;{0.875,&nbsp;0.875,&nbsp;0.875},&nbsp;selectedbackground&nbsp;=&nbsp;{1.0,&nbsp;1.0,&nbsp;1.0},&nbsp;traceColor&nbsp;=&nbsp;{0.0,&nbsp;0.0,&nbsp;1.0});
 * animationVectorScaling(force&nbsp;=&nbsp;0.0,&nbsp;torque&nbsp;=&nbsp;0.0,&nbsp;velocity&nbsp;=&nbsp;0.0,&nbsp;acceleration&nbsp;=&nbsp;0.0,&nbsp;angularvelocity&nbsp;=&nbsp;0.0,&nbsp;angularacceleration&nbsp;=&nbsp;0.0);
 * animationOnline(onlineAnimation&nbsp;=&nbsp;false,&nbsp;realtime&nbsp;=&nbsp;false,&nbsp;scaleFactor&nbsp;=&nbsp;1.0,&nbsp;loadInterval&nbsp;=&nbsp;0.5);
 * animationSubdivisions(subdivision&nbsp;=&nbsp;{16,&nbsp;8,&nbsp;16,&nbsp;1,&nbsp;1,&nbsp;64,&nbsp;1,&nbsp;1,&nbsp;12,&nbsp;12,&nbsp;6,&nbsp;12,&nbsp;1});
 * animationPerspective(perspective&nbsp;=&nbsp;{-40.0,&nbsp;40.0,&nbsp;1.0,&nbsp;100.0,&nbsp;0.0,&nbsp;0.0,&nbsp;-3.0});
 * animationSpeed(speed&nbsp;=&nbsp;1.0);
 * animationTransparency();
 * animationTrace();
 * animationRedraw();</pre></html>
 *
 * @returns {Boolean} ok
 * @throws {DymolaException}
 */
DymolaInterface.prototype.animationSetup = function () {
    var params = [];
    var result = this.callDymolaFunction("animationSetup", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>Function to change the current directory or report the current directory. Can be used both with and wihtout parantheses as in the examples below. </p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <p>Report current directory</p>
 * <pre>cd
 * cd()
 * cd(&QUOT;&QUOT;)</pre>
 * <p>Change current directory </p>
 * <pre>cd&nbsp;C:/Test/NewDir
 * cd&nbsp;(&QUOT;C:/Test/NewDir&QUOT;)</pre>
 * <p>Change to parent directory</p>
 * <pre>cd ..
 * cd(&QUOT;..&QUOT;)</pre></html>
 *
 * @param {String} [dir=""] Directory to change to. Default "".
 * @returns {Boolean} Cd ok
 * @throws {DymolaException}
 */
DymolaInterface.prototype.cd = function (dir) {
    dir = (dir === undefined) ? "" : dir;
    var params = [];
    params.push(dir);
    var result = this.callDymolaFunction("cd", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>Check the model validity. This corresponds to <b>Check (Normal)</b> in the menus.</p>
 * <p>If <code>simulate=true</code> in the call, associated commands will also be included in the check. The commands will be executed and the model will be simulated with stored simulation setup.</p>
 * <p>This corresponds to <b>Check (With simulation)</b> in the menus.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <p>Check model:</p>
 * <pre>checkModel(&QUOT;Modelica.Mechanics.Rotational.Examples.CoupledClutches&QUOT;);</pre>
 * <p>Check model and simulate it:</p>
 * <pre>checkModel(&QUOT;Modelica.Mechanics.Rotational.Examples.CoupledClutches&QUOT;,simulate=true);</pre></html>
 *
 * @param {String} problem Name of model, e.g. Modelica.Mechanics.Rotational.Components.Clutch.
 * @param {Boolean} [simulate=false] Check simulations as well. Default false.
 * @param {Boolean} [constraint=false] Check as constraining class as well. Default false.
 * @returns {Boolean} true if successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.checkModel = function (problem, simulate, constraint) {
    simulate = (simulate === undefined) ? false : simulate;
    constraint = (constraint === undefined) ? false : constraint;
    var params = [];
    params.push(problem);
    params.push(simulate);
    params.push(constraint);
    var result = this.callDymolaFunction("checkModel", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * Useful for accessing local external files.
 *
 * @returns {String} The directory in which the call resides
 * @throws {DymolaException}
 */
DymolaInterface.prototype.classDirectory = function () {
    var params = [];
    var result = this.callDymolaFunction("classDirectory", params);
    return this.parseResponseAndReturn(result, "String");
};

/**
 * <html><p>Function to clear exerything, for example the packages loaded in the Package Browser and variables created in the Commands Window.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <pre>clear
 * clear()</pre></html>
 *
 * @param {Boolean} [fast=false] Only clear user classes. Default false.
 * @returns {Boolean} Command ok
 * @throws {DymolaException}
 */
DymolaInterface.prototype.clear = function (fast) {
    fast = (fast === undefined) ? false : fast;
    var params = [];
    params.push(fast);
    var result = this.callDymolaFunction("clear", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * Clears flags and integer constants
 *
 * @returns {Boolean} Command ok
 * @throws {DymolaException}
 */
DymolaInterface.prototype.clearFlags = function () {
    var params = [];
    var result = this.callDymolaFunction("clearFlags", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>Function to clear the history in the Commands Window.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <pre>clearlog
 * clearlog()</pre></html>
 *
 * @returns {Boolean} Command ok
 * @throws {DymolaException}
 */
DymolaInterface.prototype.clearlog = function () {
    var params = [];
    var result = this.callDymolaFunction("clearlog", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * Erases curves and annotations in the diagram.
 *
 * @param {Number} [id=0] Identity of window (0-means last). Default 0.
 * @returns {Boolean} true of successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.clearPlot = function (id) {
    id = (id === undefined) ? 0 : id;
    var params = [];
    params.push(id);
    var result = this.callDymolaFunction("clearPlot", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>Create a plot window with all settings.</p>
 * <p>This built-in function contains a number of input parameters also used in other built-in functions documented below. All parameters are output parameters except the last one. Some parameters are further commented in notes below the table.</p>
 * <p>Note that if having a plot already, the command <b>File &GT; Generate Script&hellip; &GT; Plot setup</b> will produce a script (.mos) file with relevant flags and the corresponding <code>createPlot</code> function call for the plot.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <p>To illustrate how <code>createPlot</code> might look like (and also some flags from plot), use the command <b>File &GT; Demos</b> to open the model Coupled clutches, then use the command <code>Commands &GT; Simulate and Plot</code> to get a plot window.</p>
 * <p>Now use the command <code>File &GT; Generate Script&hellip; &GT; Plot setup</code> to save a script (.mos) file. Give it a name, e. g. PlotTest, and keep the default directory for saving. Note what directory that is.</p>
 * <p>Finding the file and opening it in the Dymola script editor (or in e.g. Notepad) will display:</p>
 * <pre>  // Script generated by Dymola Wed Apr 11 11:31:09 2012
 * // Plot commands
 * removePlots();
 * Advanced.FilenameInLegend = false;
 * Advanced.SequenceInLegend = true;
 * Advanced.PlotLegendTooltip = true;
 * Advanced.AbsoluteResultSequence = true;
 * Advanced.FullPlotTooltip = true;
 * <p><code><b>  createPlot</b>(id = 1,</code></p>
 * <pre>    position = {15, 10, 400, 280},
 * y = {&QUOT;J1.w&QUOT;, &QUOT;J2.w&QUOT;, &QUOT;J3.w&QUOT;, &QUOT;J4.w&QUOT;},
 * range = {0.0, 1.2000000000000002, 12.0, -2.0},
 * autoscale = true,
 * autoerase = true,
 * autoreplot = true,
 * description = false,
 * grid = true,
 * color = true,
 * online = false,
 * filename = &QUOT;dsres.mat&QUOT;,
 * leftTitleType = 1,
 * bottomTitleType = 1,
 * colors = {{0,0,255}, {255,0,0}, {0,128,0}, {255,0,255}});</pre></html>
 *
 * @param {Number} [id=0] Window id. Default 0.
 * @param {Array} [position={15, 10, 400, 283}] Window position (x0, y0, inner width, inner height). Dimension [4]. Default [15, 10, 400, 283].
 * @param {String} [x="time"] Independent variable. Default "time".
 * @param {Array} [y=fill("", 0)] Variables. Dimension [:]. Default fill("", 0).
 * @param {String} [heading=""] Plot heading. Use the command plotHeading to create a rich text heading. Default "".
 * @param {Array} [range={0.0, 1.0, 0.0, 1.0}] Range. Dimension [4]. Default [0.0, 1.0, 0.0, 1.0].
 * @param {Boolean} [erase=true] Start with a fresh window. Default true.
 * @param {Boolean} [autoscale=true] Autoscaling of y-axis. Default true.
 * @param {Boolean} [autoerase=true] Erase plot when loading new file after simulation. Default true.
 * @param {Boolean} [autoreplot=true] Automatically replot after simulation. Default true.
 * @param {Boolean} [description=false] Include description in label. Default false.
 * @param {Boolean} [grid=false] Add grid. Default false.
 * @param {Boolean} [color=true] Deprecated. Replaced by colors, patterns, markers, and thicknesses. Default true.
 * @param {Boolean} [online=false] Online plotting. Default false.
 * @param {Boolean} [legend=true] Variable legend. Default true.
 * @param {Number} [timeWindow=0.0] Time window for online plotting. Default 0.0.
 * @param {String} [filename=""] Result file to read data from. Default "".
 * @param {Number} [legendLocation=1] Where to place legend (1 above, 2 right, 3 below, 4-7 inside). Default 1.
 * @param {Boolean} [legendHorizontal=true] Horizontal legend. Default true.
 * @param {Boolean} [legendFrame=false] Draw frame around legend. Default false.
 * @param {Boolean} [supressMarker=false] Deprecated. Replaced by colors, patterns, markers, and thicknesses. Default false.
 * @param {Boolean} [logX=false] Logarithmic X scale. Default false.
 * @param {Boolean} [logY=false] Logarithmic Y scale. Default false.
 * @param {Array} [legends=fill("", size(y, 1))] Legends. Dimension [size(y, 1)]. Default fill("", size(y, 1)).
 * @param {Number} [subPlot=1] Sub plot number. Default 1.
 * @param {Boolean} [uniformScaling=false] Same vertical and horizontal axis increment. Default false.
 * @param {Number} [leftTitleType=0] Type of left axis title (0=none, 1=description, 2=custom). Default 0.
 * @param {String} [leftTitle=""] Custom left axis title. Default "".
 * @param {Number} [bottomTitleType=0] Type of bottom axis title (0=none, 1=description, 2=custom). Default 0.
 * @param {String} [bottomTitle=""] Custom bottom axis title. Default "".
 * @param {Array} [colors=fill({-1, -1, -1}, size(y, 1))] Line colors. Dimension [size(y, 1), 3]. Default fill({-1, -1, -1}, size(y, 1)).
 * @param {Array} [patterns=fill(LinePattern.Solid, size(y, 1))] Line patterns, e.g., LinePattern.Solid. Dimension [size(y, 1)]. Default fill(LinePattern.Solid, size(y, 1)). Enumeration.
 * @param {Array} [markers=fill(-1, size(y, 1))] Line markers, e.g., MarkerStyle.Cross. Dimension [size(y, 1)]. Default fill(-1, size(y, 1)). Enumeration.
 * @param {Array} [thicknesses=fill(0.25, size(y, 1))] Line thicknesses. Dimension [size(y, 1)]. Default fill(0.25, size(y, 1)).
 * @returns {Number} _window
 * @throws {DymolaException}
 */
DymolaInterface.prototype.createPlot = function (id, position, x, y, heading, range, erase, autoscale, autoerase, autoreplot, description, grid, color, online, legend, timeWindow, filename, legendLocation, legendHorizontal, legendFrame, supressMarker, logX, logY, legends, subPlot, uniformScaling, leftTitleType, leftTitle, bottomTitleType, bottomTitle, colors, patterns, markers, thicknesses) {
    var params = [];
    if (id !== undefined) {
        params.push(new DymolaNamedArgument("id", id));
    }
    if (position !== undefined) {
        params.push(new DymolaNamedArgument("position", position));
    }
    if (x !== undefined) {
        params.push(new DymolaNamedArgument("x", x));
    }
    if (y !== undefined) {
        params.push(new DymolaNamedArgument("y", y));
    }
    if (heading !== undefined) {
        params.push(new DymolaNamedArgument("heading", heading));
    }
    if (range !== undefined) {
        params.push(new DymolaNamedArgument("range", range));
    }
    if (erase !== undefined) {
        params.push(new DymolaNamedArgument("erase", erase));
    }
    if (autoscale !== undefined) {
        params.push(new DymolaNamedArgument("autoscale", autoscale));
    }
    if (autoerase !== undefined) {
        params.push(new DymolaNamedArgument("autoerase", autoerase));
    }
    if (autoreplot !== undefined) {
        params.push(new DymolaNamedArgument("autoreplot", autoreplot));
    }
    if (description !== undefined) {
        params.push(new DymolaNamedArgument("description", description));
    }
    if (grid !== undefined) {
        params.push(new DymolaNamedArgument("grid", grid));
    }
    if (color !== undefined) {
        params.push(new DymolaNamedArgument("color", color));
    }
    if (online !== undefined) {
        params.push(new DymolaNamedArgument("online", online));
    }
    if (legend !== undefined) {
        params.push(new DymolaNamedArgument("legend", legend));
    }
    if (timeWindow !== undefined) {
        params.push(new DymolaNamedArgument("timeWindow", timeWindow));
    }
    if (filename !== undefined) {
        params.push(new DymolaNamedArgument("filename", filename));
    }
    if (legendLocation !== undefined) {
        params.push(new DymolaNamedArgument("legendLocation", legendLocation));
    }
    if (legendHorizontal !== undefined) {
        params.push(new DymolaNamedArgument("legendHorizontal", legendHorizontal));
    }
    if (legendFrame !== undefined) {
        params.push(new DymolaNamedArgument("legendFrame", legendFrame));
    }
    if (supressMarker !== undefined) {
        params.push(new DymolaNamedArgument("supressMarker", supressMarker));
    }
    if (logX !== undefined) {
        params.push(new DymolaNamedArgument("logX", logX));
    }
    if (logY !== undefined) {
        params.push(new DymolaNamedArgument("logY", logY));
    }
    if (legends !== undefined) {
        params.push(new DymolaNamedArgument("legends", legends));
    }
    if (subPlot !== undefined) {
        params.push(new DymolaNamedArgument("subPlot", subPlot));
    }
    if (uniformScaling !== undefined) {
        params.push(new DymolaNamedArgument("uniformScaling", uniformScaling));
    }
    if (leftTitleType !== undefined) {
        params.push(new DymolaNamedArgument("leftTitleType", leftTitleType));
    }
    if (leftTitle !== undefined) {
        params.push(new DymolaNamedArgument("leftTitle", leftTitle));
    }
    if (bottomTitleType !== undefined) {
        params.push(new DymolaNamedArgument("bottomTitleType", bottomTitleType));
    }
    if (bottomTitle !== undefined) {
        params.push(new DymolaNamedArgument("bottomTitle", bottomTitle));
    }
    if (colors !== undefined) {
        params.push(new DymolaNamedArgument("colors", colors));
    }
    if (patterns !== undefined) {
        params.push(new DymolaNamedArgument("patterns", patterns));
    }
    if (markers !== undefined) {
        params.push(new DymolaNamedArgument("markers", markers));
    }
    if (thicknesses !== undefined) {
        params.push(new DymolaNamedArgument("thicknesses", thicknesses));
    }
    var result = this.callDymolaFunction("createPlot", params);
    return this.parseResponseAndReturn(result, "Number");
};

/**
 * <html><p>Set the default Modelica Version in Dymola. Also available in &QUOT;<b>Edit &GT; Options... &GT; Version &GT; Modelica version</b>&QUOT;</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <p>To set Modelica version 3.2.1 as default version and force upgrade of models to this version execute:</p>
 * <pre>DefaultModelicaVersion(&QUOT;3.2.1&QUOT;,&nbsp;true);</pre></html>
 *
 * @param {String} version 
 * @param {Boolean} forceUpgrade 
 * @throws {DymolaException}
 */
DymolaInterface.prototype.DefaultModelicaVersion = function (version, forceUpgrade) {
    var params = [];
    params.push(version);
    params.push(forceUpgrade);
    this.callDymolaFunction("DefaultModelicaVersion", params);
};

/**
 * write calling syntax for named function
 *
 * @param {String} _function name of builtin function.
 * @returns {Boolean} true if successful(i.e. function existed)
 * @throws {DymolaException}
 */
DymolaInterface.prototype.document = function (_function) {
    var params = [];
    params.push(_function);
    var result = this.callDymolaFunction("document", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p><code>DymolaVersion()</code> returns the full version number and date of Dymola as a String<code>. </code></p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <p>In Dymola 2014 FD01</p>
 * <pre>DymolaVersion();
 * &nbsp;=&nbsp;&QUOT;Dymola&nbsp;Version&nbsp;2014&nbsp;FD01&nbsp;(64-bit),&nbsp;2013-10-17&QUOT;</pre></html>
 *
 * @returns {String} version
 * @throws {DymolaException}
 */
DymolaInterface.prototype.DymolaVersion = function () {
    var params = [];
    var result = this.callDymolaFunction("DymolaVersion", params);
    return this.parseResponseAndReturn(result, "String");
};

/**
 * <html><p><code>DymolaVersionNumber()</code> returns the version number of Dymola as a Real number.</p>
 * <p>The decimal value is used to indicate if it is a main version (=0) or a FD version (=1 etc.) </p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <p>In Dymola 2014</p>
 * <pre>DymolaVersionNumber();
 * &nbsp;=&nbsp;2014.0</pre>
 * <p>In Dymola 2014 FD01 </p>
 * <pre>DymolaVersionNumber();
 * &nbsp;=&nbsp;2014.1 </pre></html>
 *
 * @returns {Number} versionNumber
 * @throws {DymolaException}
 */
DymolaInterface.prototype.DymolaVersionNumber = function () {
    var params = [];
    var result = this.callDymolaFunction("DymolaVersionNumber", params);
    return this.parseResponseAndReturn(result, "Number");
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
DymolaInterface.prototype.eraseClasses = function (classnames_) {
    var params = [];
    params.push(classnames_);
    var result = this.callDymolaFunction("eraseClasses", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>Function to execute a file/command.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <pre>Execute(&QUOT;test.bat&QUOT;)</pre>
 * <p>executes the batch file <code>test.bat</code> in the current directory.</p></html>
 *
 * @param {String} file 
 * @returns {Boolean} ok
 * @throws {DymolaException}
 */
DymolaInterface.prototype.Execute = function (file) {
    var params = [];
    params.push(file);
    var result = this.callDymolaFunction("Execute", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>Check if the provided names exists in the trajectory file.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <p>After simulating the example <b>File &GT; Demos &GT; Coupled clutches</b> the result file <i>CoupledClutches.mat</i> should be available in the current dir. </p>
 * <p>Executing</p>
 * <pre>existTrajectoryNames(&QUOT;CoupledClutches.mat&QUOT;,&nbsp;{&QUOT;J1.w&QUOT;,&nbsp;&QUOT;J2.w&QUOT;,&nbsp;&QUOT;J10.w&QUOT;});
 * ={true, true, false}</pre>
 * <p>indicates that <code>J1.w</code> and <code>J2.w</code> but not <code>J10.w</code> exists in the trajectory file.</p></html>
 *
 * @param {String} fileName File containing a trajectory, e.g. dsres.mat.
 * @param {Array} names Potential names in trajectory file. Dimension [:].
 * @returns {Array} Indicator for the names
 * @throws {DymolaException}
 */
DymolaInterface.prototype.existTrajectoryNames = function (fileName, names) {
    var params = [];
    params.push(fileName);
    params.push(names);
    var result = this.callDymolaFunction("existTrajectoryNames", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * <html><p>Function to exit Dymola from script.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <pre>exit
 * exit()</pre></html>
 */
DymolaInterface.prototype.exit = function () {
    try {
        var params = [];
        this.callDymolaFunction("exit", params);
    } catch (ignore) {}
};

/**
 * <html><p>Return the current simulation output setup as an array of booleans.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <pre>experimentGetOutput()</pre>
 * <p>={false, false, true, true, true, true, true, true, true, false}</p></html>
 *
 * @returns {Array} Textual storage
 * @throws {DymolaException}
 */
DymolaInterface.prototype.experimentGetOutput = function () {
    var params = [];
    var result = this.callDymolaFunction("experimentGetOutput", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * <html><p>Setup the simulation output, corresponds to the <b>Format</b>, <b>Store</b> and <b>Output selection</b> sections in <b>Simulation &GT; Setup... &GT; Output</b>.</p></html>
 *
 * @param {Boolean} [textual=false] Textual storage. Default false.
 * @param {Boolean} [doublePrecision=false] Double precision. Default false.
 * @param {Boolean} [states=true] Store state variables. Default true.
 * @param {Boolean} [derivatives=true] Store derivative variables. Default true.
 * @param {Boolean} [inputs=true] Store input variables. Default true.
 * @param {Boolean} [outputs=true] Store outputs variables. Default true.
 * @param {Boolean} [auxiliaries=true] Store auxiliary variables. Default true.
 * @param {Boolean} [equidistant=true] Store equidistantly. Default true.
 * @param {Boolean} [events=true] Store variables at events. Default true.
 * @param {Boolean} [debug=false] Write log messages. Default false.
 * @returns {Boolean} ok
 * @throws {DymolaException}
 */
DymolaInterface.prototype.experimentSetupOutput = function (textual, doublePrecision, states, derivatives, inputs, outputs, auxiliaries, equidistant, events, debug) {
    textual = (textual === undefined) ? false : textual;
    doublePrecision = (doublePrecision === undefined) ? false : doublePrecision;
    states = (states === undefined) ? true : states;
    derivatives = (derivatives === undefined) ? true : derivatives;
    inputs = (inputs === undefined) ? true : inputs;
    outputs = (outputs === undefined) ? true : outputs;
    auxiliaries = (auxiliaries === undefined) ? true : auxiliaries;
    equidistant = (equidistant === undefined) ? true : equidistant;
    events = (events === undefined) ? true : events;
    debug = (debug === undefined) ? false : debug;
    var params = [];
    params.push(textual);
    params.push(doublePrecision);
    params.push(states);
    params.push(derivatives);
    params.push(inputs);
    params.push(outputs);
    params.push(auxiliaries);
    params.push(equidistant);
    params.push(events);
    params.push(debug);
    var result = this.callDymolaFunction("experimentSetupOutput", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * Export an animation to file. Supported file formats are AVI, VRML, and X3D.
 * The file format is determined by the file extension. Use wrl as file extension for VRML.
 * If there is more than one animation window, the last window is used.
 *
 * @param {String} path File path. Supported file formats are AVI, VRML (wrl), and X3D.
 * @param {Number} [width=-1] Width. Only applicable for X3D. Default -1.
 * @param {Number} [height=-1] Height. Only applicable for X3D. Default -1.
 * @returns {Boolean} true if successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.exportAnimation = function (path, width, height) {
    width = (width === undefined) ? -1 : width;
    height = (height === undefined) ? -1 : height;
    var params = [];
    params.push(path);
    params.push(width);
    params.push(height);
    var result = this.callDymolaFunction("exportAnimation", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * Export the diagram layer to file. Supported file formats are PNG and SVG.
 * The file format is determined by the file extension. To export in SVG, the diagram layer must exist.
 *
 * @param {String} path File path. Supported file formats are PNG and SVG.
 * @param {Number} [width=400] Width. Default 400.
 * @param {Number} [height=400] Height. Default 400.
 * @param {Boolean} [trim=true] Remove unnecessary space around the image. Default true.
 * @returns {Boolean} true if successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.exportDiagram = function (path, width, height, trim) {
    width = (width === undefined) ? 400 : width;
    height = (height === undefined) ? 400 : height;
    trim = (trim === undefined) ? true : trim;
    var params = [];
    params.push(path);
    params.push(width);
    params.push(height);
    params.push(trim);
    var result = this.callDymolaFunction("exportDiagram", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * Export the documentation for a model to an HTML file.
 *
 * @param {String} path File path. Supported file format is HTML.
 * @param {String} [className=""] Name of model, e.g. Modelica.Mechanics.Rotational.Components.Clutch. Default "".
 * @returns {Boolean} true if successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.exportDocumentation = function (path, className) {
    className = (className === undefined) ? "" : className;
    var params = [];
    params.push(path);
    params.push(className);
    var result = this.callDymolaFunction("exportDocumentation", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * Export the equations to file. Supported file formats are PNG and MathML.
 * The file format is determined by the file extension. Use mml as file extension for MathML.
 *
 * @param {String} path File path. Supported file formats are PNG and MathML (mml).
 * @returns {Boolean} true if successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.exportEquations = function (path) {
    var params = [];
    params.push(path);
    var result = this.callDymolaFunction("exportEquations", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * Export the icon layer to file. Supported file formats are PNG and SVG.
 * The file format is determined by the file extension. To export in SVG, the icon layer must exist.
 *
 * @param {String} path File path. Supported file formats are PNG and SVG.
 * @param {Number} [width=80] Width. Default 80.
 * @param {Number} [height=80] Height. Default 80.
 * @param {Boolean} [trim=true] Remove unnecessary space around the image. Default true.
 * @returns {Boolean} true if successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.exportIcon = function (path, width, height, trim) {
    width = (width === undefined) ? 80 : width;
    height = (height === undefined) ? 80 : height;
    trim = (trim === undefined) ? true : trim;
    var params = [];
    params.push(path);
    params.push(width);
    params.push(height);
    params.push(trim);
    var result = this.callDymolaFunction("exportIcon", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>The function generates a Modelica script, such that running the script re-creates the simulation setup. After running the generated script it is possible to override specific parameters or start-values before simulating. By generating a script from a &ldquo;steady-state&rdquo; dsfinal.txt it is possible to perform parameter studies from that point.</p>
 * <p><b>Note:</b> This cannot be combined with non-standard setting of fixed for variables if <code>dsName=&QUOT;dsin.txt&QUOT;</code>. All other cases work fine.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <pre>exportInitial(&QUOT;dsin.txt&QUOT;,&nbsp;&QUOT;scripInitial.mos&QUOT;)</pre></html>
 *
 * @param {String} dsName 
 * @param {String} scriptName 
 * @param {Boolean} exportAllVariables 
 * @param {Boolean} exportSimulator 
 * @returns {Boolean} ok
 * @throws {DymolaException}
 */
DymolaInterface.prototype.exportInitial = function (dsName, scriptName, exportAllVariables, exportSimulator) {
    var params = [];
    params.push(dsName);
    params.push(scriptName);
    params.push(exportAllVariables);
    params.push(exportSimulator);
    var result = this.callDymolaFunction("exportInitial", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * Generate a copy of internal dsin.txt
 *
 * @param {String} scriptName 
 * @returns {Boolean} ok
 * @throws {DymolaException}
 */
DymolaInterface.prototype.exportInitialDsin = function (scriptName) {
    var params = [];
    params.push(scriptName);
    var result = this.callDymolaFunction("exportInitialDsin", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>Export (save) a plot window as an image. The image can only be saved in .png format. The parameter id specifies what plot window will be saved. The default -1 means the first (lowest number) plot window in the Dymola main window. The <code>includeInLog</code> specifies whether the plot should be included in the command log. </p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <p><code>ExportPlotAsImage(E:/MyExperiment/Plots/Plot3.png, id=3)</code> </p>
 * <p>will save the plot window Plot[3] as the image Plot3.png in the folder E:\MyExperiment\Plots. It will also be saved in the command log.</p></html>
 *
 * @param {String} fileName The path to save the plot. Export is done in PNG format.
 * @param {Number} [id=-1] ID of the plot window to export. -1 means last plot window. Default -1.
 * @param {Boolean} [includeInLog=true] Include image in command log. Default true.
 * @param {Boolean} [onlyActiveSubplot=true] Include all subplots or only the active subplot. Default true.
 * @returns {Boolean} ok
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ExportPlotAsImage = function (fileName, id, includeInLog, onlyActiveSubplot) {
    id = (id === undefined) ? -1 : id;
    includeInLog = (includeInLog === undefined) ? true : includeInLog;
    onlyActiveSubplot = (onlyActiveSubplot === undefined) ? true : onlyActiveSubplot;
    var params = [];
    params.push(fileName);
    params.push(id);
    params.push(includeInLog);
    params.push(onlyActiveSubplot);
    var result = this.callDymolaFunction("ExportPlotAsImage", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * Returns the Modelica text for a given model.
 *
 * @param {String} fullName Name of model, e.g. Modelica.Mechanics.Rotational.Components.Clutch.
 * @param {Boolean} [includeAnnotations=false] Include annotations. Default false.
 * @param {Boolean} [formatted=false] If the text should be returned as HTML or plain text. Default false.
 * @returns {Boolean} The Modelica text. (String), true if the model is read-only. (Boolean)
 * @throws {DymolaException}
 */
DymolaInterface.prototype.getClassText = function (fullName, includeAnnotations, formatted) {
    includeAnnotations = (includeAnnotations === undefined) ? false : includeAnnotations;
    formatted = (formatted === undefined) ? false : formatted;
    var params = [];
    params.push(fullName);
    params.push(includeAnnotations);
    params.push(formatted);
    var result = this.callDymolaFunction("getClassText", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * Get current experiment setting
 *
 * @returns {Number} Start of simulation (Number), End of simulation (Number) (Number), Number of output points (Number) (Number), Distance between output points (Number) (Number), Integration method (String) (String), Tolerance of integration (Number) (Number), Fixed step size for Euler (Number)
 * @throws {DymolaException}
 */
DymolaInterface.prototype.getExperiment = function () {
    var params = [];
    var result = this.callDymolaFunction("getExperiment", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * <html><p>Returns the last error. If the last command was successful an empty string is returned. For check, translate, etc, the log is returned.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <pre>translateModel(&QUOT;Modelica.Mechanics.Rotational.Examples.CoupledClutches&QUOT;);
 * getLastError()
 * &nbsp;=&nbsp;&QUOT;Warning:&nbsp;Undeclared&nbsp;variable&nbsp;or&nbsp;command:&nbsp;Modelica.Constants.g_n
 * Warning:&nbsp;Undeclared&nbsp;variable&nbsp;or&nbsp;command:&nbsp;Modelica.Constants.g_n
 * Error:&nbsp;Failed&nbsp;to&nbsp;write&nbsp;dsin.txt.
 * Translation&nbsp;of&nbsp;&LT;a&nbsp;href=\&QUOT;Modelica://Modelica.Mechanics.Rotational.Examples.CoupledClutches\&QUOT;&GT;Modelica.Mechanics.Rotational.Examples.CoupledClutches&LT;/a&GT;:
 * The&nbsp;DAE&nbsp;has&nbsp;106&nbsp;scalar&nbsp;unknowns&nbsp;and&nbsp;106&nbsp;scalar&nbsp;equations.
 * &nbsp;
 * Statistics
 * &nbsp;
 * Original&nbsp;Model
 * &nbsp;&nbsp;Number&nbsp;of&nbsp;components:&nbsp;14
 * &nbsp;&nbsp;Variables:&nbsp;182
 * &nbsp;&nbsp;Constants:&nbsp;23&nbsp;(23&nbsp;scalars)
 * &nbsp;&nbsp;Parameters:&nbsp;53&nbsp;(56&nbsp;scalars)
 * &nbsp;&nbsp;Unknowns:&nbsp;106&nbsp;(106&nbsp;scalars)
 * &nbsp;&nbsp;Differentiated&nbsp;variables:&nbsp;14&nbsp;scalars
 * &nbsp;&nbsp;Equations:&nbsp;98
 * &nbsp;&nbsp;&nbsp;&nbsp;Nontrivial&nbsp;:&nbsp;79
 * Translated&nbsp;Model
 * &nbsp;&nbsp;Constants:&nbsp;38&nbsp;scalars
 * &nbsp;&nbsp;Free&nbsp;parameters:&nbsp;39&nbsp;scalars
 * &nbsp;&nbsp;Parameter&nbsp;depending:&nbsp;3&nbsp;scalars
 * &nbsp;&nbsp;Continuous&nbsp;time&nbsp;states:&nbsp;8&nbsp;scalars
 * &nbsp;&nbsp;Time-varying&nbsp;variables:&nbsp;51&nbsp;scalars
 * &nbsp;&nbsp;Alias&nbsp;variables:&nbsp;54&nbsp;scalars
 * &nbsp;&nbsp;Number&nbsp;of&nbsp;mixed&nbsp;real/discrete&nbsp;systems&nbsp;of&nbsp;equations:&nbsp;1
 * &nbsp;&nbsp;Sizes&nbsp;of&nbsp;linear&nbsp;systems&nbsp;of&nbsp;equations:&nbsp;{13}
 * &nbsp;&nbsp;Sizes&nbsp;after&nbsp;manipulation&nbsp;of&nbsp;the&nbsp;linear&nbsp;systems:&nbsp;{4}
 * &nbsp;&nbsp;Sizes&nbsp;of&nbsp;nonlinear&nbsp;systems&nbsp;of&nbsp;equations:&nbsp;{&nbsp;}
 * &nbsp;&nbsp;Sizes&nbsp;after&nbsp;manipulation&nbsp;of&nbsp;the&nbsp;nonlinear&nbsp;systems:&nbsp;{&nbsp;}
 * &nbsp;&nbsp;Number&nbsp;of&nbsp;numerical&nbsp;Jacobians:&nbsp;0
 * &nbsp;
 * Selected&nbsp;continuous&nbsp;time&nbsp;states
 * Statically&nbsp;selected&nbsp;continuous&nbsp;time&nbsp;states
 * &nbsp;&nbsp;clutch1.phi_rel
 * &nbsp;&nbsp;clutch1.w_rel
 * &nbsp;&nbsp;clutch2.phi_rel
 * &nbsp;&nbsp;clutch2.w_rel
 * &nbsp;&nbsp;clutch3.phi_rel
 * &nbsp;&nbsp;clutch3.w_rel
 * &nbsp;&nbsp;J1.phi
 * &nbsp;&nbsp;J1.w
 * &QUOT;</pre></html>
 *
 * @returns {String} The error message from the last command.
 * @throws {DymolaException}
 */
DymolaInterface.prototype.getLastError = function () {
    var params = [];
    var result = this.callDymolaFunction("getLastError", params);
    return this.parseResponseAndReturn(result, "String");
};

/**
 * <html><p>Imports an FMU, i. e. unzips, XSL transforms the model description and opens the resulting Modelica model. Note: The model description file from any previous import is replaced. This also applies to the binary library files.</p>
 * <p>This built-in function corresponds to the command <b>File &GT; Import &GT; FMU&hellip;</b>.</p>
 * <p>For more information, please see the manual &ldquo;Dymola User Manual Volume 2&rdquo;, chapter 6 &ldquo;Other Simulation Environments&rdquo;, section &ldquo;FMI Support in Dymola&rdquo;.</p>
 * <p>Note: For big models it is recommended to set<code> includeAllVariables=false </code>to avoid the Modelica wrapper becoming huge.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <pre>importFMU(&QUOT;C:/test/Modelica_Mechanics_Rotational_Examples_CoupledClutches.fmu&QUOT;,&nbsp;true,&nbsp;true,&nbsp;false,&nbsp;&QUOT;&QUOT;);</pre></html>
 *
 * @param {String} fileName The FMU file.
 * @param {Boolean} [includeAllVariables=true] Include other variables than inputs, outputs and parameters. Default true.
 * @param {Boolean} [integrate=true] Integrate outside the FMU, set to false for co-simulation. Default true.
 * @param {Boolean} [promptReplacement=false] Prompt for name and save location when importing. Default false.
 * @param {String} [packageName=""] Name of package to insert FMU in. Default "".
 * @returns {Boolean} True if successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.importFMU = function (fileName, includeAllVariables, integrate, promptReplacement, packageName) {
    includeAllVariables = (includeAllVariables === undefined) ? true : includeAllVariables;
    integrate = (integrate === undefined) ? true : integrate;
    promptReplacement = (promptReplacement === undefined) ? false : promptReplacement;
    packageName = (packageName === undefined) ? "" : packageName;
    var params = [];
    params.push(fileName);
    params.push(includeAllVariables);
    params.push(integrate);
    params.push(promptReplacement);
    params.push(packageName);
    var result = this.callDymolaFunction("importFMU", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>This function sets up integration or linearization to start from the initial conditions given in the file specified (including start and stop-time and choice of integration algorithm). The default is &ldquo;dsfinal.txt&rdquo;.</p>
 * <p>(Calling the function<code> importInitial </code>with the (unchanged) default file, followed by calling the function <code>simulate</code> corresponds to the command <b>Simulation &GT; Continue &GT; Continue</b>. The function <code>simulate</code> works like <code>simulateModel</code>, but works with the default model.)</p>
 * <p>After calling<code> importInitial </code>it is possible to override specific parameters or start-values before simulating by using the usual parameter setting in the variable browser.</p>
 * <p>Calling the function <code>importInitial</code> with a text file that differs from the unchanged default file corresponds to the command <b>Simulation &GT; Continue &GT; Import Initial&hellip;</b>.</p>
 * <p>Please see the section &ldquo;Simulation &GT; Continue &GT; Import Initial&hellip;&rdquo; in the User Manual for more additional important information.</p>
 * <p>Note: Basically <code>importInitial()</code> corresponds to copying dsfinal.txt (the default variable output file containing variable values etc. at the end of the simulation) to dsin.txt (the default variable input file for a simulation run). Please compare the command below.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <pre>importInitial(&QUOT;C:/test/dsfinal.txt&QUOT;);</pre></html>
 *
 * @param {String} [dsName="dsfinal.txt"]  Default "dsfinal.txt".
 * @returns {Boolean} ok
 * @throws {DymolaException}
 */
DymolaInterface.prototype.importInitial = function (dsName) {
    dsName = (dsName === undefined) ? "dsfinal.txt" : dsName;
    var params = [];
    params.push(dsName);
    var result = this.callDymolaFunction("importInitial", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>This function is similar to<code> importInitial</code>, with the following exceptions:</p>
 * <ul>
 * <li>The start value file has to be specified, and it has to be a simulation result, i.e. a file that you can plot/animate.</li>
 * <li>The start time has to be specified.</li>
 * <li>The integration method will be the one presently selected.</li>
 * </ul>
 * <p>Concerning other information, please see <code>importInitial</code>.</p></html>
 *
 * @param {String} dsResName 
 * @param {Number} atTime 
 * @returns {Boolean} ok
 * @throws {DymolaException}
 */
DymolaInterface.prototype.importInitialResult = function (dsResName, atTime) {
    var params = [];
    params.push(dsResName);
    params.push(atTime);
    var result = this.callDymolaFunction("importInitialResult", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>This function sets states and parameters to fixed and all other variables to free. It is used before setting initial values for states and parameters. <code>isInitialized=true</code> is default (and corresponds to continuing a simulation). If false it will initialize according to the initial equations at the start of the simulation.</p></html>
 *
 * @param {Boolean} [allVars=false]  Default false.
 * @param {Boolean} [isInitialized=true]  Default true.
 * @throws {DymolaException}
 */
DymolaInterface.prototype.initialized = function (allVars, isInitialized) {
    allVars = (allVars === undefined) ? false : allVars;
    isInitialized = (isInitialized === undefined) ? true : isInitialized;
    var params = [];
    params.push(allVars);
    params.push(isInitialized);
    this.callDymolaFunction("initialized", params);
};

/**
 * <html><p>Interpolates multiple variables from a trajectory file. This is useful for post-processing of simulations results: comparison with references, plotting, etc.</p></html>
 *
 * @param {String} fileName File containing a trajectory, e.g. dsres.mat.
 * @param {Array} signals Vector of variable names, in Modelica-syntax, e.g a[1].b. Dimension [:].
 * @param {Array} times The time-points to interpolate at; most efficient if increasing. Dimension [:].
 * @returns {Array} Interpolated values
 * @throws {DymolaException}
 */
DymolaInterface.prototype.interpolateTrajectory = function (fileName, signals, times) {
    var params = [];
    params.push(fileName);
    params.push(signals);
    params.push(times);
    var result = this.callDymolaFunction("interpolateTrajectory", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * <html><p>The function translates a model (if not done previously) and then calculates a linearized model at the initial values. The linearized model is by default stored in the Dymola working directory in Matlab format as the file <code>dslin.mat</code>.</p>
 * <p>This built-in function corresponds to the command <b>Simulation &GT; Linearize</b>. For more information about the content of the dslin.mat file and handling of linearization, please see the section about that command, section &ldquo;Simulation &GT; Linearize&rdquo; in Dymola User Manual. In particular note how to linearize around other values than the initial ones (the corresponding parameters in the function cannot be used to change the time-point of linearization).</p></html>
 *
 * @param {String} [problem=""] Name of model, e.g. Modelica.Mechanics.Rotational.Components.Clutch. Default "".
 * @param {Number} [startTime=0.0] Start of simulation. Default 0.0.
 * @param {Number} [stopTime=1.0] End of simulation. Default 1.0.
 * @param {Number} [numberOfIntervals=0] Number of output points. Default 0.
 * @param {Number} [outputInterval=0.0] Distance between output points. Default 0.0.
 * @param {String} [method="Dassl"] Integration method. Default "Dassl".
 * @param {Number} [tolerance=0.0001] Tolerance of integration. Default 0.0001.
 * @param {Number} [fixedstepsize=0.0] Fixed step size for Euler. Default 0.0.
 * @param {String} [resultFile="dslin"] Where to store result. Default "dslin".
 * @returns {Boolean} true if successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.linearizeModel = function (problem, startTime, stopTime, numberOfIntervals, outputInterval, method, tolerance, fixedstepsize, resultFile) {
    problem = (problem === undefined) ? "" : problem;
    startTime = (startTime === undefined) ? 0.0 : startTime;
    stopTime = (stopTime === undefined) ? 1.0 : stopTime;
    numberOfIntervals = (numberOfIntervals === undefined) ? 0 : numberOfIntervals;
    outputInterval = (outputInterval === undefined) ? 0.0 : outputInterval;
    method = (method === undefined) ? "Dassl" : method;
    tolerance = (tolerance === undefined) ? 0.0001 : tolerance;
    fixedstepsize = (fixedstepsize === undefined) ? 0.0 : fixedstepsize;
    resultFile = (resultFile === undefined) ? "dslin" : resultFile;
    var params = [];
    params.push(problem);
    params.push(startTime);
    params.push(stopTime);
    params.push(numberOfIntervals);
    params.push(outputInterval);
    params.push(method);
    params.push(tolerance);
    params.push(fixedstepsize);
    params.push(resultFile);
    var result = this.callDymolaFunction("linearizeModel", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>Writes a list of interactive variables and their values to the screen (or file). The list includes both interactive variables, and interactive setting of translator switches such as Evaluate.</p>
 * <p><br>The function lists (on screen or to a file) the interactive variables in the variable workspace with their type and value. Predefined variables are also described by a comment. Also interactive settings of translator switches such as Evaluate are listed. </p>
 * <p>The output from the function is in alphabethical order, and grouped. </p>
 * <p>The wildcards * and ? are supported.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <ul>
 * <li><code>list(variables={&QUOT;A*&QUOT;})</code> &ndash; lists all items starting with A. </li>
 * <li><code>list(variables={&QUOT;Advanced.*&QUOT;})</code> &ndash; lists all items starting with <code>Advanced.</code> &ndash; that is, list all Advanced flags settings.</li>
 * <li><code>list(variables={&QUOT;*Output*&QUOT;})</code> &ndash; lists all items containing<code> Output</code> in the text.</li>
 * </ul>
 * <p>It is possible to write the variables to a script file (which can be executed) <code>filename=&QUOT;script.mos&QUOT;</code>, and limit it to certain variables by using <code>variables={&QUOT;var1&QUOT;,&QUOT;var2&QUOT;}</code>.</p></html>
 *
 * @param {String} [filename=""]  Default "".
 * @param {Array} [variables={"*"}] Select a subset of the variables. Wildcards * and ? may be used. Dimension [:]. Default ["*"].
 * @throws {DymolaException}
 */
DymolaInterface.prototype.list = function (filename, variables) {
    filename = (filename === undefined) ? "" : filename;
    variables = (variables === undefined) ? ["*"] : variables;
    var params = [];
    params.push(filename);
    params.push(variables);
    this.callDymolaFunction("list", params);
};

/**
 * Writes a list of builtin functions and their descriptions to the screen.
 *
 * @param {String} [filter="*"] Select a subset of the functions. Wildcards * and ? may be used. Default "*".
 * @throws {DymolaException}
 */
DymolaInterface.prototype.listfunctions = function (filter) {
    filter = (filter === undefined) ? "*" : filter;
    var params = [];
    params.push(filter);
    this.callDymolaFunction("listfunctions", params);
};

/**
 * <html><p>Load animation data from result file in animation window.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <pre>loadAnimation(&QUOT;resultFile.mat&QUOT;,&nbsp;2);</pre>
 * <p>loads the animation data (if available) from <code>resultFile.mat </code>in the animation window with <code>id=2</code> (second animation window opened).</p>
 * <pre>loadAnimation(&QUOT;otherResultFile.mat&QUOT;,&nbsp;2, true);</pre>
 * <p>loads the animation in the same windows as the previous command (window #2) keeping the old animation in the window. Both animations (from <code>resultFile.mat</code> and <code>otherResultFile.mat</code>) will be in the same animation window.</p></html>
 *
 * @param {String} fileName 
 * @param {Number} [id=0] New window if zero else number of window. Default 0.
 * @param {Boolean} [together=false] Similar to Animate together. Default false.
 * @throws {DymolaException}
 */
DymolaInterface.prototype.loadAnimation = function (fileName, id, together) {
    id = (id === undefined) ? 0 : id;
    together = (together === undefined) ? false : together;
    var params = [];
    params.push(fileName);
    params.push(id);
    params.push(together);
    this.callDymolaFunction("loadAnimation", params);
};

/**
 * <html><p>Reads the file specified by <code>path</code>, for example <code>openModel(path=&QUOT;E:\Experiments\MyLib.mo&QUOT;)</code>, and displays its window. This corresponds to<b> File &GT; Open</b> in the menus. Note: This will automatically change directory to the right directory.</p>
 * <p><code>mustRead=false</code> means that if the file already is opened/read, it is not opened/read again. If <code>mustRead=true</code> in such a case the user is promted for removing the present one and open it again. The default value <code>false</code> can be useful in scriping, when only wanting to assure that a certain file has been read.</p></html>
 *
 * @param {String} path File-path to open.
 * @param {Boolean} [mustRead=true] If false we can skip reading the file. Default true.
 * @returns {Boolean} true if successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.openModel = function (path, mustRead) {
    mustRead = (mustRead === undefined) ? true : mustRead;
    var params = [];
    params.push(path);
    params.push(mustRead);
    var result = this.callDymolaFunction("openModel", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * Opens a Modelica-file and pops up a window with the given model in it
 *
 * @param {String} modelName Model to open.
 * @param {String} [path=""] File-path to open (can be the empty string). Default "".
 * @param {String} [version=""] Version to open (can be the empty string). Default "".
 * @returns {Boolean} true if successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.openModelFile = function (modelName, path, version) {
    path = (path === undefined) ? "" : path;
    version = (version === undefined) ? "" : version;
    var params = [];
    params.push(modelName);
    params.push(path);
    params.push(version);
    var result = this.callDymolaFunction("openModelFile", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>Plot the given variables in the plot window. It is currently not possible to set ranges or independent variable.</p>
 * <p>Note: the argument is a vector of strings; the names correspond to the names when selecting variables in the plot window. Subcomponents are accessed by dot-notation.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <p>After running <b>File &GT; Demos &GT; Coupled clutches</b>, the function call</p>
 * <pre>  plot({&QUOT;J1.w&QUOT;, &QUOT;J2.w&QUOT;}, colors={{0,0,255}, {255,0,0}},
 * patterns={LinePattern.Dash, LinePattern.Solid},
 * markers={MarkerStyle.None, MarkerStyle.Cross},
 * thicknesses={0.500000, 0.250000});</pre>
 * <p>plots <code>J1.w</code> and <code>J2.w</code>.</p></html>
 *
 * @param {Array} y Variables. Dimension [:].
 * @param {Array} [legends=fill("", size(y, 1))] Legends. Dimension [size(y, 1)]. Default fill("", size(y, 1)).
 * @param {Boolean} [plotInAll=false] Plot variable from all files. Default false.
 * @param {Array} [colors=fill({-1, -1, -1}, size(y, 1))] Line colors. Dimension [size(y, 1), 3]. Default fill({-1, -1, -1}, size(y, 1)).
 * @param {Array} [patterns=fill(LinePattern.Solid, size(y, 1))] Line patterns, e.g., LinePattern.Solid. Dimension [size(y, 1)]. Default fill(LinePattern.Solid, size(y, 1)). Enumeration.
 * @param {Array} [markers=fill(-1, size(y, 1))] Line markers, e.g., MarkerStyle.Cross. Dimension [size(y, 1)]. Default fill(-1, size(y, 1)). Enumeration.
 * @param {Array} [thicknesses=fill(0.25, size(y, 1))] Line thicknesses. Dimension [size(y, 1)]. Default fill(0.25, size(y, 1)).
 * @returns {Boolean} true if successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.plot = function (y, legends, plotInAll, colors, patterns, markers, thicknesses) {
    var params = [];
    if (y !== undefined) {
        params.push(new DymolaNamedArgument("y", y));
    }
    if (legends !== undefined) {
        params.push(new DymolaNamedArgument("legends", legends));
    }
    if (plotInAll !== undefined) {
        params.push(new DymolaNamedArgument("plotInAll", plotInAll));
    }
    if (colors !== undefined) {
        params.push(new DymolaNamedArgument("colors", colors));
    }
    if (patterns !== undefined) {
        params.push(new DymolaNamedArgument("patterns", patterns));
    }
    if (markers !== undefined) {
        params.push(new DymolaNamedArgument("markers", markers));
    }
    if (thicknesses !== undefined) {
        params.push(new DymolaNamedArgument("thicknesses", thicknesses));
    }
    var result = this.callDymolaFunction("plot", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>X-y plot for plotting of data computed in functions or scripts. For plot of arrays, please see the function <code>plotArrays</code>.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <pre>plotArray(x=1:10,y=sin(1:10), pattern=LinePattern.Dash,
 * marker=MarkerStyle.Cross,color={0,128,0},thickness=0.5,
 * legend=&QUOT;Plotted data&QUOT;);</pre></html>
 *
 * @param {Array} x X-values. Dimension [:].
 * @param {Array} y Y-values. Dimension [size(x, 1)].
 * @param {Number} [style=0] Deprecated. Replaced by color, pattern, marker, and thickness. Default 0.
 * @param {String} [legend=""] Legend describing plotted data. Default "".
 * @param {Number} [id=0] Identity of window (0-means last). Default 0.
 * @param {Array} [color={-1, -1, -1}] Line color. Dimension [3]. Default [-1, -1, -1].
 * @param {Number} [pattern=LinePattern.Solid] Line pattern, e.g., LinePattern.Solid. Default LinePattern.Solid. Enumeration.
 * @param {Number} [marker=-1] Line marker, e.g., MarkerStyle.Cross. Default -1. Enumeration.
 * @param {Number} [thickness=0.25] Line thickness. Default 0.25.
 * @param {Boolean} [erase=true] Erase window content before plotting. Default true.
 * @returns {Boolean} true if successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.plotArray = function (x, y, style, legend, id, color, pattern, marker, thickness, erase) {
    style = (style === undefined) ? 0 : style;
    legend = (legend === undefined) ? "" : legend;
    id = (id === undefined) ? 0 : id;
    color = (color === undefined) ? [-1, -1, -1] : color;
    pattern = (pattern === undefined) ? LinePattern.Solid : pattern;
    marker = (marker === undefined) ? -1 : marker;
    thickness = (thickness === undefined) ? 0.25 : thickness;
    erase = (erase === undefined) ? true : erase;
    var params = [];
    params.push(x);
    params.push(y);
    params.push(style);
    params.push(legend);
    params.push(id);
    params.push(color);
    params.push(pattern);
    params.push(marker);
    params.push(thickness);
    params.push(erase);
    var result = this.callDymolaFunction("plotArray", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>X-y plot for plotting of data computed in functions or scripts. Note similarity with the function <code>plotArray</code>. </p>
 * <p>(The input style[:] is deprecated.)</p></html>
 *
 * @param {Array} x X-values. Dimension [:].
 * @param {Array} y Y-values. Dimension [size(x, 1), :].
 * @param {Array} [style={0}] Deprecated. Replaced by colors, patterns, markers, and thicknesses. Dimension [:]. Default [0].
 * @param {Array} [legend={""}] Legends describing plotted data. Dimension [:]. Default [""].
 * @param {Number} [id=0] Identity of window (0-means last). Default 0.
 * @param {String} [title=""] Plot heading. Use the command plotHeading to create a rich text plot heading. Default "".
 * @param {Array} [colors=fill({-1, -1, -1}, size(y, 2))] Line colors. Dimension [size(y, 2), 3]. Default fill({-1, -1, -1}, size(y, 2)).
 * @param {Array} [patterns=fill(LinePattern.Solid, size(y, 2))] Line patterns, e.g., LinePattern.Solid. Dimension [size(y, 2)]. Default fill(LinePattern.Solid, size(y, 2)). Enumeration.
 * @param {Array} [markers=fill(MarkerStyle.None, size(y, 2))] Line markers, e.g., MarkerStyle.Cross. Dimension [size(y, 2)]. Default fill(MarkerStyle.None, size(y, 2)). Enumeration.
 * @param {Array} [thicknesses=fill(0.25, size(y, 2))] Line thicknesses. Dimension [size(y, 2)]. Default fill(0.25, size(y, 2)).
 * @throws {DymolaException}
 */
DymolaInterface.prototype.plotArrays = function (x, y, style, legend, id, title, colors, patterns, markers, thicknesses) {
    var params = [];
    if (x !== undefined) {
        params.push(new DymolaNamedArgument("x", x));
    }
    if (y !== undefined) {
        params.push(new DymolaNamedArgument("y", y));
    }
    if (style !== undefined) {
        params.push(new DymolaNamedArgument("style", style));
    }
    if (legend !== undefined) {
        params.push(new DymolaNamedArgument("legend", legend));
    }
    if (id !== undefined) {
        params.push(new DymolaNamedArgument("id", id));
    }
    if (title !== undefined) {
        params.push(new DymolaNamedArgument("title", title));
    }
    if (colors !== undefined) {
        params.push(new DymolaNamedArgument("colors", colors));
    }
    if (patterns !== undefined) {
        params.push(new DymolaNamedArgument("patterns", patterns));
    }
    if (markers !== undefined) {
        params.push(new DymolaNamedArgument("markers", markers));
    }
    if (thicknesses !== undefined) {
        params.push(new DymolaNamedArgument("thicknesses", thicknesses));
    }
    this.callDymolaFunction("plotArrays", params);
};

/**
 * <html><p>The function plots an expression in a specified plot window. </p>
 * <p>The <code>expressionName</code> is the description string of the expression; it will be displayed as the label of the expression. The <code>id</code> is the identity of the plot window, where &ldquo;0&rdquo; is the last window, -1 the second last etc.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <pre>plotExpression(apply(CoupledClutches[end].J1.w+CoupledClutches[end-1].J1.w), false,
 * &QUOT;CoupledClutches[end].J1.w+CoupledClutches[end-1].J1.w&QUOT;, 1);</pre></html>
 *
 * @param {string} mapFunction apply expression.
 * @param {Boolean} [eraseOld=false] if true, erase old plot content. Default false.
 * @param {String} [expressionName=""] Legend describing plotted data. Default "".
 * @param {Number} [id=0]  Default 0.
 * @returns {Boolean} true if successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.plotExpression = function (mapFunction, eraseOld, expressionName, id) {
    eraseOld = (eraseOld === undefined) ? false : eraseOld;
    expressionName = (expressionName === undefined) ? "" : expressionName;
    id = (id === undefined) ? 0 : id;
    var params = [];
    if (!mapFunction.startsWith("apply")) {
        mapFunction = "apply(" + mapFunction + ")";
    }
    params.push(new DymolaUnquotedString(mapFunction));
    params.push(eraseOld);
    params.push(expressionName);
    params.push(id);
    var result = this.callDymolaFunction("plotExpression", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>This function creates a heading in a plot window. An empty string as <code>textstring</code> removes the heading.
 * <code>fontSize=0</code> means that the default base font size is used. For more about font size, and about <code>textStyle</code> and
 * <code>horizontalAlignment</code>, see the function <code>plotText</code>.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <pre>plotHeading(textString=&QUOT;Coupled Clutches\nw plots&QUOT;,fontSize=12, lineColor={0,0,255}, textStyle={TextStyle.Bold, TextStyle.Italic});</pre>
 * </html>
 *
 * @param {String} [textString=""] Text string. An empty string removes the heading. Default "".
 * @param {Number} [fontSize=0] Font size. A zero value means that the default base font size is used. Default 0.
 * @param {String} [fontName=""] Font family. An empty string means that the default font family is used. Default "".
 * @param {Array} [lineColor={0, 0, 0}] Text color. Dimension [3]. Default [0, 0, 0].
 * @param {Array} [textStyle=fill(TextStyle.Bold, 0)] Text style. Available values are TextStyle.Bold, TextStyle.Italic, and TextStyle.UnderLine. Dimension [:]. Default fill(TextStyle.Bold, 0). Enumeration.
 * @param {Number} [horizontalAlignment=TextAlignment.Center] Horizontal alignment. Available values are TextAlignment.Left, TextAlignment.Center, TextAlignment.Right. Default TextAlignment.Center. Enumeration.
 * @param {Number} [id=0] Identity of window (0-means last). Default 0.
 * @returns {Boolean} true if successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.plotHeading = function (textString, fontSize, fontName, lineColor, textStyle, horizontalAlignment, id) {
    var params = [];
    if (textString !== undefined) {
        params.push(new DymolaNamedArgument("textString", textString));
    }
    if (fontSize !== undefined) {
        params.push(new DymolaNamedArgument("fontSize", fontSize));
    }
    if (fontName !== undefined) {
        params.push(new DymolaNamedArgument("fontName", fontName));
    }
    if (lineColor !== undefined) {
        params.push(new DymolaNamedArgument("lineColor", lineColor));
    }
    if (textStyle !== undefined) {
        params.push(new DymolaNamedArgument("textStyle", textStyle));
    }
    if (horizontalAlignment !== undefined) {
        params.push(new DymolaNamedArgument("horizontalAlignment", horizontalAlignment));
    }
    if (id !== undefined) {
        params.push(new DymolaNamedArgument("id", id));
    }
    var result = this.callDymolaFunction("plotHeading", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>The function plots a curve defined by a parameter; the x(s) &ndash; y(s) plot.</p>
 * <p><code>labelWithS</code> will present parameter labels in the curve if set to true, it corresponds to the context menu command Parameter Labels.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <pre>s=0:0.1:10
 * y={sin(t)*exp(-0.1*t) for t in s}
 * x={cos(t)*exp(-0.1*t) for t in s}
 * plotParametricCurve(x,y,s,labelWithS=true);</pre></html>
 *
 * @param {Array} x x(s) values. Dimension [:].
 * @param {Array} y y(s) values. Dimension [size(x, 1)].
 * @param {Array} s s values. Dimension [size(x, 1)].
 * @param {String} [xName=""] The name of the x variable. Default "".
 * @param {String} [yName=""] The name of the y variable. Default "".
 * @param {String} [sName=""] The name of the s parameter. Default "".
 * @param {String} [legend=""] Legend describing plotted data. Default "".
 * @param {Number} [id=0] Identity of window (0-means last). Default 0.
 * @param {Array} [color={-1, -1, -1}] Line color. Dimension [3]. Default [-1, -1, -1].
 * @param {Number} [pattern=LinePattern.Solid] Line pattern, e.g., LinePattern.Solid. Default LinePattern.Solid. Enumeration.
 * @param {Number} [marker=-1] Line marker, e.g., MarkerStyle.Cross. Default -1. Enumeration.
 * @param {Number} [thickness=0.25] Line thickness. Default 0.25.
 * @param {Boolean} [labelWithS=false] if true, output values of s along the curve. Default false.
 * @param {Boolean} [erase=true] Erase window content before plotting. Default true.
 * @returns {Boolean} true if successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.plotParametricCurve = function (x, y, s, xName, yName, sName, legend, id, color, pattern, marker, thickness, labelWithS, erase) {
    xName = (xName === undefined) ? "" : xName;
    yName = (yName === undefined) ? "" : yName;
    sName = (sName === undefined) ? "" : sName;
    legend = (legend === undefined) ? "" : legend;
    id = (id === undefined) ? 0 : id;
    color = (color === undefined) ? [-1, -1, -1] : color;
    pattern = (pattern === undefined) ? LinePattern.Solid : pattern;
    marker = (marker === undefined) ? -1 : marker;
    thickness = (thickness === undefined) ? 0.25 : thickness;
    labelWithS = (labelWithS === undefined) ? false : labelWithS;
    erase = (erase === undefined) ? true : erase;
    var params = [];
    params.push(x);
    params.push(y);
    params.push(s);
    params.push(xName);
    params.push(yName);
    params.push(sName);
    params.push(legend);
    params.push(id);
    params.push(color);
    params.push(pattern);
    params.push(marker);
    params.push(thickness);
    params.push(labelWithS);
    params.push(erase);
    var result = this.callDymolaFunction("plotParametricCurve", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>The function plots curves defined by x(s) &ndash; y(s). The function is an extension of the function <code>plotParametricCurve</code>, covering multiple curves.</p></html>
 *
 * @param {Array} x x(s) vectors. Dimension [:, size(s, 1)].
 * @param {Array} y y(s) vectors. Dimension [size(x, 1), size(s, 1)].
 * @param {Array} s s values. Dimension [:].
 * @param {String} [xName=""] The name of the x variable. Default "".
 * @param {String} [yName=""] The name of the y variable. Default "".
 * @param {String} [sName=""] The name of the s parameter. Default "".
 * @param {Array} [legends=fill("", size(y, 1))] Legends describing plotted data. Dimension [:]. Default fill("", size(y, 1)).
 * @param {Number} [id=0] Identity of window (0-means last). Default 0.
 * @param {Array} [colors=fill({-1, -1, -1}, size(y, 1))] Line colors. Dimension [size(y, 1), 3]. Default fill({-1, -1, -1}, size(y, 1)).
 * @param {Array} [patterns=fill(LinePattern.Solid, size(y, 1))] Line patterns, e.g., LinePattern.Solid. Dimension [size(y, 1)]. Default fill(LinePattern.Solid, size(y, 1)). Enumeration.
 * @param {Array} [markers=fill(MarkerStyle.None, size(y, 1))] Line markers, e.g., MarkerStyle.Cross. Dimension [size(y, 1)]. Default fill(MarkerStyle.None, size(y, 1)). Enumeration.
 * @param {Array} [thicknesses=fill(0.25, size(y, 1))] Line thicknesses. Dimension [size(y, 1)]. Default fill(0.25, size(y, 1)).
 * @param {Boolean} [labelWithS=false] if true, output values of s along the curve. Default false.
 * @throws {DymolaException}
 */
DymolaInterface.prototype.plotParametricCurves = function (x, y, s, xName, yName, sName, legends, id, colors, patterns, markers, thicknesses, labelWithS) {
    var params = [];
    if (x !== undefined) {
        params.push(new DymolaNamedArgument("x", x));
    }
    if (y !== undefined) {
        params.push(new DymolaNamedArgument("y", y));
    }
    if (s !== undefined) {
        params.push(new DymolaNamedArgument("s", s));
    }
    if (xName !== undefined) {
        params.push(new DymolaNamedArgument("xName", xName));
    }
    if (yName !== undefined) {
        params.push(new DymolaNamedArgument("yName", yName));
    }
    if (sName !== undefined) {
        params.push(new DymolaNamedArgument("sName", sName));
    }
    if (legends !== undefined) {
        params.push(new DymolaNamedArgument("legends", legends));
    }
    if (id !== undefined) {
        params.push(new DymolaNamedArgument("id", id));
    }
    if (colors !== undefined) {
        params.push(new DymolaNamedArgument("colors", colors));
    }
    if (patterns !== undefined) {
        params.push(new DymolaNamedArgument("patterns", patterns));
    }
    if (markers !== undefined) {
        params.push(new DymolaNamedArgument("markers", markers));
    }
    if (thicknesses !== undefined) {
        params.push(new DymolaNamedArgument("thicknesses", thicknesses));
    }
    if (labelWithS !== undefined) {
        params.push(new DymolaNamedArgument("labelWithS", labelWithS));
    }
    this.callDymolaFunction("plotParametricCurves", params);
};

/**
 * <html><p>The function plots a signal operator in the active diagram of a plot window. The following signal operators are presently available:</p>
 * <pre>  Signal operators:
 * SignalOperator.Min
 * SignalOperator.Max
 * SignalOperator.ArithmeticMean
 * SignalOperator.RectifiedMean
 * SignalOperator.RMS
 * SignalOperator.ACCoupledRMS
 * SignalOperator.SlewRate</pre>
 * <p>Note that First Harmonic and Total Harmonic Distortion are not supported by this function, please see next function.</p>
 * <p>The <code>id</code> is the identity of the plot window, where &ldquo;0&rdquo; is the last window, -1 the second last etc.</p>
 * <p>The resulting signal operator is displayed in the plot, and the numerical result is output as <code>result</code>.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <p>After running <b>File &GT; Demos &GT; Coupled clutches</b> by <b>Commands &GT; Simulate and Plot</b> and then plotting <code>J1.a</code></p>
 * <pre>plotSignalOperator(&QUOT;J1.a&QUOT;, SignalOperator.RectifiedMean, 0.8, 1.2, 1);
 * = 5.075379430627545</pre></html>
 *
 * @param {String} variablePath Variable.
 * @param {Number} signalOperator Signal operator. See enumeration :class:`SignalOperator <dymola.dymola_enums.SignalOperator>` for available operators. Enumeration.
 * @param {Number} startTime Start time.
 * @param {Number} stopTime Stop time.
 * @param {Number} [period=0.0] Obsolete. Use function plotSignalOperatorHarmonic for First Harmonic and Total Harmonic Distortion. Default 0.0.
 * @param {Number} [id=0] Identity of window (0-means last). Default 0.
 * @returns {Number} Returns the value of the signal operator
 * @throws {DymolaException}
 */
DymolaInterface.prototype.plotSignalOperator = function (variablePath, signalOperator, startTime, stopTime, period, id) {
    period = (period === undefined) ? 0.0 : period;
    id = (id === undefined) ? 0 : id;
    var params = [];
    params.push(variablePath);
    params.push(signalOperator);
    params.push(startTime);
    params.push(stopTime);
    params.push(period);
    params.push(id);
    var result = this.callDymolaFunction("plotSignalOperator", params);
    return this.parseResponseAndReturn(result, "Number");
};

/**
 * <html><p>The function plots a signal operator in the active diagram of a plot window.</p>
 * <p>Note, the package SignalOperators must be present in the package browser to be able to execute this function. The package can be opened by e.g. <code>import SignalOperators</code>.</p>
 * <p>The following signal operators are presently supported for this function:</p>
 * <pre>  SignalOperator.FirstHarmonic
 * SignalOperator.THD</pre>
 * <p>Compare with the function <code>plotSignalOperator</code> that supports other signal operators.</p>
 * <p>The <code>window</code> is the windowing function for FFT, it can be set to any of</p>
 * <pre>  SignalOperators.Windows.Windowing.Rectangular
 * SignalOperators.Windows.Windowing.Hamming
 * SignalOperators.Windows.Windowing.Hann
 * SignalOperators.Windows.Windowing.FlatTop</pre>
 * <p>The <code>harmonicNo</code> is the relevant harmonic number.</p>
 * <p>The <code>id</code> is the identity of the plot window, where &ldquo;0&rdquo; is the last window, -1 the second last etc.</p>
 * <p>The resulting signal operator is displayed in the plot, and the numerical result is output as <code>result</code>.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <p>After simulating <b>File &GT; Demos &GT; Coupled clutches</b> and plotting <code>J1.a</code></p>
 * <pre>plotSignalOperatorHarmonic(&QUOT;J1.a&QUOT;, SignalOperator.FirstHarmonic, 0.8, 1.2, 0.2, 1e-3, SignalOperators.Windows.Windowing.Rectangular, 1);
 * =&nbsp;9.313418460891956</pre></html>
 *
 * @param {String} variablePath Variable.
 * @param {Number} signalOperator Signal operator. See enumeration :class:`SignalOperator <dymola.dymola_enums.SignalOperator>` for available operators. Enumeration.
 * @param {Number} startTime Start time.
 * @param {Number} stopTime Stop time.
 * @param {Number} period Period length.
 * @param {Number} intervalLength Sampling interval length.
 * @param {Number} window Windowing function for FFT. Enumeration.
 * @param {Number} harmonicNo Relevant harmonic number.
 * @param {Number} [id=0] Identity of window (0-means last). Default 0.
 * @returns {Number} Returns the value of the signal operator
 * @throws {DymolaException}
 */
DymolaInterface.prototype.plotSignalOperatorHarmonic = function (variablePath, signalOperator, startTime, stopTime, period, intervalLength, window, harmonicNo, id) {
    id = (id === undefined) ? 0 : id;
    var params = [];
    params.push(variablePath);
    params.push(signalOperator);
    params.push(startTime);
    params.push(stopTime);
    params.push(period);
    params.push(intervalLength);
    params.push(window);
    params.push(harmonicNo);
    params.push(id);
    var result = this.callDymolaFunction("plotSignalOperatorHarmonic", params);
    return this.parseResponseAndReturn(result, "Number");
};

/**
 * <html><p>Insert a text object in the active diagram. The text is rendered using diagram coordinates.</p>
 * <p>&ldquo;Null-extent&rdquo; (both coordinates in the extent being the same) is possible; the text will be centered on the specific point.</p>
 * p>If the fontSize attribute is 0 the text is scaled to fit its extents, otherwise the size specifies the absolute size. However, if a minimum font size is set; that size will be the smallest font size. This implies that to create a useful &ldquo;null-extent&rdquo; text, the minimum font size should be set. For setting of minimum font size, please see previous chapter, the command <b>Edit &GT; Options, Appearance</b> tab, the setting Restrict minimum font size.</p>
 * <p>All installed fonts on the computer are supported.</p>
 * <p>Available <code>textStyle</code> values are (by default none of these are activated)</p>
 * <pre>  TextStyle.Bold</pre><pre>  TextStyle.Italic</pre><pre>  TextStyle.UnderLine</pre>
 * <p>Available <code>horizontalAlignment</code> values are (by default the text is centered)</p>
 * <pre>  TextAlignment.Left</pre><pre>  TextAlignment.Center</pre><pre>  TextAlignment.Right</pre>
 * <p>The text is vertically centered in the extent.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <p>The text &ldquo;Note!&rdquo; is inserted in a plot using </p>
 * <pre>plotText(extent={{0.85,13},{0.85,13}},textString=&QUOT;Note!&QUOT;, lineColor={255,0,0},textStyle={TextStyle.Italic,TextStyle.UnderLine},fontName=&QUOT;Courier&QUOT;);</pre></html>
 *
 * @param {Array} extent Extent. Dimension [2, 2].
 * @param {String} textString Text string.
 * @param {Number} [fontSize=0] Font size. Default 0.
 * @param {String} [fontName=""] Font family. Default "".
 * @param {Array} [lineColor={0, 0, 0}] Text color. Dimension [3]. Default [0, 0, 0].
 * @param {Array} [textStyle=fill(TextStyle.Bold, 0)] Text style. Available values are TextStyle.Bold, TextStyle.Italic, and TextStyle.UnderLine. Dimension [:]. Default fill(TextStyle.Bold, 0). Enumeration.
 * @param {Number} [horizontalAlignment=TextAlignment.Center] Horizontal alignment. Available values are TextAlignment.Left, TextAlignment.Center, TextAlignment.Right. Default TextAlignment.Center. Enumeration.
 * @param {Number} [id=0] Identity of window (0-means last). Default 0.
 * @returns {Boolean} true if successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.plotText = function (extent, textString, fontSize, fontName, lineColor, textStyle, horizontalAlignment, id) {
    var params = [];
    if (extent !== undefined) {
        params.push(new DymolaNamedArgument("extent", extent));
    }
    if (textString !== undefined) {
        params.push(new DymolaNamedArgument("textString", textString));
    }
    if (fontSize !== undefined) {
        params.push(new DymolaNamedArgument("fontSize", fontSize));
    }
    if (fontName !== undefined) {
        params.push(new DymolaNamedArgument("fontName", fontName));
    }
    if (lineColor !== undefined) {
        params.push(new DymolaNamedArgument("lineColor", lineColor));
    }
    if (textStyle !== undefined) {
        params.push(new DymolaNamedArgument("textStyle", textStyle));
    }
    if (horizontalAlignment !== undefined) {
        params.push(new DymolaNamedArgument("horizontalAlignment", horizontalAlignment));
    }
    if (id !== undefined) {
        params.push(new DymolaNamedArgument("id", id));
    }
    var result = this.callDymolaFunction("plotText", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>Generate a <code>createPlot()</code> command of the plot window given by <code>_id</code>.</p></html>
 *
 * @param {Number} _window 
 * @returns {Boolean} ok
 * @throws {DymolaException}
 */
DymolaInterface.prototype.plotWindowSetup = function (_window) {
    var params = [];
    params.push(_window);
    var result = this.callDymolaFunction("plotWindowSetup", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>Plot the variables and furthermore prints the resulting plot on the default printer.</p></html>
 *
 * @param {Array} y Variables. Dimension [:].
 * @param {Array} [legends=fill("", size(y, 1))] Legends. Dimension [size(y, 1)]. Default fill("", size(y, 1)).
 * @param {Boolean} [plotInAll=false] Plot variable from all files. Default false.
 * @param {Array} [colors=fill({-1, -1, -1}, size(y, 1))] Line colors. Dimension [size(y, 1), 3]. Default fill({-1, -1, -1}, size(y, 1)).
 * @param {Array} [patterns=fill(LinePattern.Solid, size(y, 1))] Line patterns, e.g., LinePattern.Solid. Dimension [size(y, 1)]. Default fill(LinePattern.Solid, size(y, 1)). Enumeration.
 * @param {Array} [markers=fill(-1, size(y, 1))] Line markers, e.g., MarkerStyle.Cross. Dimension [size(y, 1)]. Default fill(-1, size(y, 1)). Enumeration.
 * @param {Array} [thicknesses=fill(0.25, size(y, 1))] Line thicknesses. Dimension [size(y, 1)]. Default fill(0.25, size(y, 1)).
 * @returns {Boolean} true if successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.printPlot = function (y, legends, plotInAll, colors, patterns, markers, thicknesses) {
    var params = [];
    if (y !== undefined) {
        params.push(new DymolaNamedArgument("y", y));
    }
    if (legends !== undefined) {
        params.push(new DymolaNamedArgument("legends", legends));
    }
    if (plotInAll !== undefined) {
        params.push(new DymolaNamedArgument("plotInAll", plotInAll));
    }
    if (colors !== undefined) {
        params.push(new DymolaNamedArgument("colors", colors));
    }
    if (patterns !== undefined) {
        params.push(new DymolaNamedArgument("patterns", patterns));
    }
    if (markers !== undefined) {
        params.push(new DymolaNamedArgument("markers", markers));
    }
    if (thicknesses !== undefined) {
        params.push(new DymolaNamedArgument("thicknesses", thicknesses));
    }
    var result = this.callDymolaFunction("printPlot", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>Plot the variables using <code>plotArray</code> and furthermore prints the resulting plot on the default printer.</p></html>
 *
 * @param {Array} x X-values. Dimension [:].
 * @param {Array} y Y-values. Dimension [size(x, 1)].
 * @param {Number} [style=0] Deprecated. Replaced by color, pattern, marker, and thickness. Default 0.
 * @param {String} [legend=""] Legend describing plotted data. Default "".
 * @param {Number} [id=0] Identity of window (0-means last). Default 0.
 * @param {Array} [color={-1, -1, -1}] Line color. Dimension [3]. Default [-1, -1, -1].
 * @param {Number} [pattern=LinePattern.Solid] Line pattern, e.g., LinePattern.Solid. Default LinePattern.Solid. Enumeration.
 * @param {Number} [marker=-1] Line marker, e.g., MarkerStyle.Cross. Default -1. Enumeration.
 * @param {Number} [thickness=0.25] Line thickness. Default 0.25.
 * @param {Boolean} [erase=true] Erase window content before plotting. Default true.
 * @returns {Boolean} true if successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.printPlotArray = function (x, y, style, legend, id, color, pattern, marker, thickness, erase) {
    style = (style === undefined) ? 0 : style;
    legend = (legend === undefined) ? "" : legend;
    id = (id === undefined) ? 0 : id;
    color = (color === undefined) ? [-1, -1, -1] : color;
    pattern = (pattern === undefined) ? LinePattern.Solid : pattern;
    marker = (marker === undefined) ? -1 : marker;
    thickness = (thickness === undefined) ? 0.25 : thickness;
    erase = (erase === undefined) ? true : erase;
    var params = [];
    params.push(x);
    params.push(y);
    params.push(style);
    params.push(legend);
    params.push(id);
    params.push(color);
    params.push(pattern);
    params.push(marker);
    params.push(thickness);
    params.push(erase);
    var result = this.callDymolaFunction("printPlotArray", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>Plot the variables using <code>plotArrays</code> and furthermore prints the resulting plot on the default printer.</p></html>
 *
 * @param {Array} x X-values. Dimension [:].
 * @param {Array} y Y-values. Dimension [size(x, 1), :].
 * @param {Array} [style={0}] Deprecated. Replaced by colors, patterns, markers, and thicknesses. Dimension [:]. Default [0].
 * @param {Array} [legend={""}] Legends describing plotted data. Dimension [:]. Default [""].
 * @param {Number} [id=0] Identity of window (0-means last). Default 0.
 * @param {String} [title=""] Plot heading. Use the command plotHeading to create a rich text plot heading. Default "".
 * @param {Array} [colors=fill({-1, -1, -1}, size(y, 2))] Line colors. Dimension [size(y, 2), 3]. Default fill({-1, -1, -1}, size(y, 2)).
 * @param {Array} [patterns=fill(LinePattern.Solid, size(y, 2))] Line patterns, e.g., LinePattern.Solid. Dimension [size(y, 2)]. Default fill(LinePattern.Solid, size(y, 2)). Enumeration.
 * @param {Array} [markers=fill(MarkerStyle.None, size(y, 2))] Line markers, e.g., MarkerStyle.Cross. Dimension [size(y, 2)]. Default fill(MarkerStyle.None, size(y, 2)). Enumeration.
 * @param {Array} [thicknesses=fill(0.25, size(y, 2))] Line thicknesses. Dimension [size(y, 2)]. Default fill(0.25, size(y, 2)).
 * @throws {DymolaException}
 */
DymolaInterface.prototype.printPlotArrays = function (x, y, style, legend, id, title, colors, patterns, markers, thicknesses) {
    var params = [];
    if (x !== undefined) {
        params.push(new DymolaNamedArgument("x", x));
    }
    if (y !== undefined) {
        params.push(new DymolaNamedArgument("y", y));
    }
    if (style !== undefined) {
        params.push(new DymolaNamedArgument("style", style));
    }
    if (legend !== undefined) {
        params.push(new DymolaNamedArgument("legend", legend));
    }
    if (id !== undefined) {
        params.push(new DymolaNamedArgument("id", id));
    }
    if (title !== undefined) {
        params.push(new DymolaNamedArgument("title", title));
    }
    if (colors !== undefined) {
        params.push(new DymolaNamedArgument("colors", colors));
    }
    if (patterns !== undefined) {
        params.push(new DymolaNamedArgument("patterns", patterns));
    }
    if (markers !== undefined) {
        params.push(new DymolaNamedArgument("markers", markers));
    }
    if (thicknesses !== undefined) {
        params.push(new DymolaNamedArgument("thicknesses", thicknesses));
    }
    this.callDymolaFunction("printPlotArrays", params);
};

/**
 * <html><p>Read a matrix from a file. The file must either be a Matlab v4-file or a textual file.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <p>After simulating the example <b>File &GT; Demos &GT; Coupled clutches</b> the result file <i>CoupledClutches.mat</i> should be available in the current dir. </p>
 * <pre>readMatrixSize(&QUOT;CoupledClutches.mat&QUOT;,&nbsp;&QUOT;data_2&QUOT;)</pre>
 * <p>={63,1522}</p>
 * <p>returns the size of the <code>data_2</code> matrix in the file <code>CoupledClutches.mat</code>, which is a 63 x 1522 matrix. This information is needed when calling <code>readMatrix</code>.</p>
 * <pre>data=readMatrix(&QUOT;CoupledClutches.mat&QUOT;,&nbsp;&QUOT;data_2&QUOT;,&nbsp;63,&nbsp;1522)
 * Declaring&nbsp;variable:&nbsp;Real&nbsp;data&nbsp;[63,&nbsp;1522];</pre>
 * <p>to read the data_2 matrix and store it in the variable <code>data</code>.</p></html>
 *
 * @param {String} fileName File containing the matrix, e.g. A.mat, dsin.txt.
 * @param {String} matrixName Name of the matrix on the file.
 * @param {Number} rows Number of rows of the matrix - see :func:`readMatrixSize`.
 * @param {Number} columns Number of column of the matrix - see :func:`readMatrixSize`.
 * @returns {Array} matrix
 * @throws {DymolaException}
 */
DymolaInterface.prototype.readMatrix = function (fileName, matrixName, rows, columns) {
    var params = [];
    params.push(fileName);
    params.push(matrixName);
    params.push(rows);
    params.push(columns);
    var result = this.callDymolaFunction("readMatrix", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * <html><p>Read the size of a matrix from a file. The file must either be a Matlab v4-file or a textual file. Can be used to declare the size of matrix returned by readMatrix</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <p>After simulating the example <b>File &GT; Demos &GT; Coupled clutches</b> the result file <i>CoupledClutches.mat</i> should be available in the current dir. </p>
 * <pre>readMatrixSize(&QUOT;CoupledClutches.mat&QUOT;,&nbsp;&QUOT;data_2&QUOT;)</pre>
 * <p>={63,1522}</p>
 * <p>returns the size of the <code>data_2</code> matrix in the file <code>CoupledClutches.mat</code>, which is a 63 x 1522 matrix.</p></html>
 *
 * @param {String} fileName File containing the matrix, e.g. A.mat, dsin.txt.
 * @param {String} matrixName Name of the matrix on the file.
 * @returns {Array} Number of rows and columns of the matrix
 * @throws {DymolaException}
 */
DymolaInterface.prototype.readMatrixSize = function (fileName, matrixName) {
    var params = [];
    params.push(fileName);
    params.push(matrixName);
    var result = this.callDymolaFunction("readMatrixSize", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * <html><p>Read a matrix from a file. The file must either be a Matlab v4-file or a textual file.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <p>After simulating the example <b>File &GT; Demos &GT; Coupled clutches</b> the result file <i>CoupledClutches.mat</i> should be available in the current dir. </p>
 * <pre>readMatrixSize(&QUOT;CoupledClutches.mat&QUOT;,&nbsp;&QUOT;name&QUOT;)</pre>
 * <p>={21,180}</p>
 * <p>returns the size of the <code>name</code> matrix in the file <i>CoupledClutches.mat</i>, which is a 21 x 180 matrix. This information is needed when calling <code>readStringMatrix</code>.</p>
 * <pre>names=readStringMatrix(&QUOT;CoupledClutches.mat&QUOT;,&nbsp;&QUOT;name&QUOT;,&nbsp;21)
 * Declaring&nbsp;variable:&nbsp;String&nbsp;names&nbsp;[21];</pre>
 * <p>to read the <code>name</code> matrix and store it in the variable <code>names</code>. This function is not recommended to read names from a trajectory file since those names are stored transposed in the matrix.</p>
 * <p>The example above will for example constain the first letter in of each variable name at index 1, the second letter of each variable name at index 2,...</p>
 * <p>For such trajectory files a more suitable function to use is <code>readTrajectoryNames</code>. </p></html>
 *
 * @param {String} fileName File containing the matrix, e.g. A.mat, dsin.txt.
 * @param {String} matrixName Name of the matrix on the file.
 * @param {Number} rows Number of rows of the matrix - see :func:`readMatrixSize`.
 * @returns {Array} matrix
 * @throws {DymolaException}
 */
DymolaInterface.prototype.readStringMatrix = function (fileName, matrixName, rows) {
    var params = [];
    params.push(fileName);
    params.push(matrixName);
    params.push(rows);
    var result = this.callDymolaFunction("readStringMatrix", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * <html><p>Returns all output points of a trajectory. Useful for post-processing.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <p>After simulating the example <b>File &GT; Demos &GT; Coupled clutches</b> the result file <i>CoupledClutches.mat</i> should be available in the current dir. </p>
 * <p>Executing </p>
 * <pre>readTrajectorySize(&QUOT;CoupledClutches.mat&QUOT;);
 * &nbsp;=&nbsp;1522</pre>
 * <p>to get the number of output points (needed as argument in addition to fileName and trajectory names which can be aquired by readTrajectoryNames) the function can be called to get one or more trajectories.</p>
 * <p>Execute</p>
 * <pre>signals=readTrajectory(&QUOT;CoupledClutches.mat&QUOT;,&nbsp;{&QUOT;freqHz&QUOT;,&nbsp;&QUOT;T2&QUOT;},&nbsp;1522)</pre>
 * <p>Declaring&nbsp;variable:&nbsp;Real&nbsp;signals&nbsp;[2,&nbsp;1522];</p>
 * <p>to get the trajectories for <code>freqHz</code> and <code>T2</code> and store in the variable <code>signals</code>.</p></html>
 *
 * @param {String} fileName File containing a trajectory, e.g. dsres.mat.
 * @param {Array} signals Vector of variable names, in Modelica-syntax, e.g a[1].b. Dimension [:].
 * @param {Number} rows Number of time-points to return - preferably the result of readTrajectorySize.
 * @returns {Array} Values of the signals, duplicate times indicate before and after event
 * @throws {DymolaException}
 */
DymolaInterface.prototype.readTrajectory = function (fileName, signals, rows) {
    var params = [];
    params.push(fileName);
    params.push(signals);
    params.push(rows);
    var result = this.callDymolaFunction("readTrajectory", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * <html><p>Returns the names of the trajectories in the file.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <p>After simulating the example <b>File &GT; Demos &GT; Coupled clutches</b> the result file <i>CoupledClutches.mat</i> should be available in the current dir. </p>
 * <p>Executing</p>
 * <pre>readTrajectoryNames(&QUOT;CoupledClutches.mat&QUOT;);
 * &nbsp;=&nbsp;{&QUOT;Time&QUOT;, &QUOT;freqHz&QUOT;, &QUOT;T2&QUOT;, &QUOT;T3&QUOT;, ...}</pre>
 * <p>returns the trajectory names found in the file.</p></html>
 *
 * @param {String} fileName File containing a trajectory, e.g. dsres.mat.
 * @returns {Array} Names in trajectory file
 * @throws {DymolaException}
 */
DymolaInterface.prototype.readTrajectoryNames = function (fileName) {
    var params = [];
    params.push(fileName);
    var result = this.callDymolaFunction("readTrajectoryNames", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * <html><p>Computes number of output points of trajectory. Useful for declaring the result of readTrajectory.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <p>After simulating the example <b>File &GT; Demos &GT; Coupled clutches</b> the result file <i>CoupledClutches.mat</i> should be available in the current dir. </p>
 * <p>Executing</p>
 * <pre>readTrajectorySize(&QUOT;CoupledClutches.mat&QUOT;);
 * &nbsp;=&nbsp;1522</pre>
 * <p>indicates that there are 1522 output points in the trajectory file.</p></html>
 *
 * @param {String} fileName File containing a trajectory, e.g. dsres.mat.
 * @returns {Number} Number of time-points in the trajectory
 * @throws {DymolaException}
 */
DymolaInterface.prototype.readTrajectorySize = function (fileName) {
    var params = [];
    params.push(fileName);
    var result = this.callDymolaFunction("readTrajectorySize", params);
    return this.parseResponseAndReturn(result, "Number");
};

/**
 * <html><p>Removes all plot windows and optionally closes all result files.</p></html>
 *
 * @param {Boolean} [closeResults=true] Close all result files. Default true.
 * @returns {Boolean} ok
 * @throws {DymolaException}
 */
DymolaInterface.prototype.removePlots = function (closeResults) {
    closeResults = (closeResults === undefined) ? true : closeResults;
    var params = [];
    params.push(closeResults);
    var result = this.callDymolaFunction("removePlots", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>Remove all result files from the Variable Browser.</p></html>
 *
 * @throws {DymolaException}
 */
DymolaInterface.prototype.removeResults = function () {
    var params = [];
    this.callDymolaFunction("removeResults", params);
};

/**
 * <html><p>Start an animation.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <pre>RunAnimation()</pre>
 * <p>Run all open animation windows.</p>
 * <pre>RunAnimation(immediate=false)</pre>
 * <p>Set the animation window to run when new data is loaded.</p>
 * <pre>RunAnimation(loadFile=&QUOT;resultFile.mat&QUOT;)</pre>
 * <p>Load <code>resultFile.mat</code> and run the animation.</p></html>
 *
 * @param {Boolean} [immediate=true] if false the next time something is loaded we run the animation. Default true.
 * @param {String} [loadFile=""] if non-empty: load this file first. Default "".
 * @param {Boolean} [ensureAnimationWindow=false] if true ensure that one animation window. Default false.
 * @param {Boolean} [eraseOld=true] Erase previous results. Default true.
 * @returns {Boolean} ok
 * @throws {DymolaException}
 */
DymolaInterface.prototype.RunAnimation = function (immediate, loadFile, ensureAnimationWindow, eraseOld) {
    immediate = (immediate === undefined) ? true : immediate;
    loadFile = (loadFile === undefined) ? "" : loadFile;
    ensureAnimationWindow = (ensureAnimationWindow === undefined) ? false : ensureAnimationWindow;
    eraseOld = (eraseOld === undefined) ? true : eraseOld;
    var params = [];
    params.push(immediate);
    params.push(loadFile);
    params.push(ensureAnimationWindow);
    params.push(eraseOld);
    var result = this.callDymolaFunction("RunAnimation", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>Executes the specified script, see example in section &ldquo;Running a Modelica script file&rdquo; in Dymola User Manual. <code>silent</code> means that commands are not echoed if this setting is true.</p></html>
 *
 * @param {String} script Script to execute.
 * @param {Boolean} [silent=false] Do not echo executed commands. Default false.
 * @returns {Boolean} Command ok
 * @throws {DymolaException}
 */
DymolaInterface.prototype.RunScript = function (script, silent) {
    silent = (silent === undefined) ? false : silent;
    var params = [];
    params.push(script);
    params.push(silent);
    var result = this.callDymolaFunction("RunScript", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>The function saves the command log on a file. Please note that depending on file extension specified, filtering of the content saved is activated or not. If a <code>.txt</code> file extension is used, all text in the log is saved. If however a <code>.mos</code> extension (e. g. <code>&QUOT;fileName=MyLog.mos&QUOT;</code>) is used, neither outputs from Dymola (results etc.) nor commands that have no equivalent Modelica function will be included in the saved script file. This latter alternative corresponds to the<b> File &GT; Save</b>&hellip;command, ticking only the alternative <b>Command log</b>. </p>
 * <p>Using the .mos extension (creating a script file) enables saving e. g. a promising sequence of interactive events for further reuse and development. The <code>.txt</code> extension can be used when documenting.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <pre>savelog()</pre>
 * <p>Saves the contents of the Commands Window to the default log file, <code>dymolalg.txt</code></p>
 * <pre>savelog(&QUOT;logfile.txt&QUOT;)
 * savelog(fileName=&QUOT;logfile.txt&QUOT;)</pre>
 * <p>Saves the contents of the Commands Window to the file <code>logfile.txt</code></p></html>
 *
 * @param {String} [logfile="dymolalg.txt"] File to store log in. Default "dymolalg.txt".
 * @returns {Boolean} Command ok
 * @throws {DymolaException}
 */
DymolaInterface.prototype.savelog = function (logfile) {
    logfile = (logfile === undefined) ? "dymolalg.txt" : logfile;
    var params = [];
    params.push(logfile);
    var result = this.callDymolaFunction("savelog", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>The function <code>saveSettings</code> corresponds to the command <b>File &GT; Generate Script&hellip;</b> except storing of the command log and storing the script file as a command in the model. (Storing of the command log can be handled by the function savelog().) Please see &QUOT;Dymola User Manual Volume 1&QUOT; ... , for more information. </p>
 * <p>Please note that if a script file should be created, the file extension must be <code>.mos </code>(e.g. <code>fileName=&QUOT;MyScript.mos&QUOT;</code>). </p>
 * <p>When storing variable values, a condition is that <code>storeVariables=true</code> in the function call. <code>storeInitial=false</code> will store final values. <code>storeAllVariables=false</code> will store only parameters and states.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <pre>saveSettings(fileName=&QUOT;mySettings.mos&QUOT;)</pre>
 * <p>to save the selected settings to a Modelcia script file <code>mySettings.mos</code>.</p></html>
 *
 * @param {String} fileName File to store in.
 * @param {Boolean} [storePlot=false] Store plot commands. Default false.
 * @param {Boolean} [storeAnimation=false] Store animation commands. Default false.
 * @param {Boolean} [storeSettings=false] Store global flags. Default false.
 * @param {Boolean} [storeVariables=false] Store current parameter setting. Default false.
 * @param {Boolean} [storeInitial=true] Store variables at initial point. Default true.
 * @param {Boolean} [storeAllVariables=true] Store all variables. Default true.
 * @param {Boolean} [storeSimulator=true] Store simulator setup. Default true.
 * @returns {Boolean} ok
 * @throws {DymolaException}
 */
DymolaInterface.prototype.saveSettings = function (fileName, storePlot, storeAnimation, storeSettings, storeVariables, storeInitial, storeAllVariables, storeSimulator) {
    storePlot = (storePlot === undefined) ? false : storePlot;
    storeAnimation = (storeAnimation === undefined) ? false : storeAnimation;
    storeSettings = (storeSettings === undefined) ? false : storeSettings;
    storeVariables = (storeVariables === undefined) ? false : storeVariables;
    storeInitial = (storeInitial === undefined) ? true : storeInitial;
    storeAllVariables = (storeAllVariables === undefined) ? true : storeAllVariables;
    storeSimulator = (storeSimulator === undefined) ? true : storeSimulator;
    var params = [];
    params.push(fileName);
    params.push(storePlot);
    params.push(storeAnimation);
    params.push(storeSettings);
    params.push(storeVariables);
    params.push(storeInitial);
    params.push(storeAllVariables);
    params.push(storeSimulator);
    var result = this.callDymolaFunction("saveSettings", params);
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
DymolaInterface.prototype.saveTotalModel = function (fileName, modelName) {
    var params = [];
    params.push(fileName);
    params.push(modelName);
    var result = this.callDymolaFunction("saveTotalModel", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * Sets the Modelica text for an existing or new class.
 *
 * @param {String} parentName The package in which to add the class.
 * @param {String} fullText The Modelica text.
 * @returns {Boolean} true if successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.setClassText = function (parentName, fullText) {
    var params = [];
    params.push(parentName);
    params.push(fullText);
    var result = this.callDymolaFunction("setClassText", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>Set up the compiler and compiler options on Windows.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <h5>Visual Studio</h5>
 * <pre>SetDymolaCompiler(&QUOT;vs&QUOT;, {&QUOT;CCompiler=MSVC&QUOT;,&QUOT;MSVCDir=C:/Program Files (x86)/Microsoft Visual Studio 10.0/Vc&QUOT;});</pre>
 * <h5>GCC</h5>
 * <pre>SetDymolaCompiler(&QUOT;gcc&QUOT;, {&QUOT;CCompiler=GCC&QUOT;,&QUOT;GCCPath=C:/MinGW/bin/gcc&QUOT;});</pre>
 * <h4>Options</h4>
 * <p>Set any of <code>DLL</code>, <code>DDE</code> or <code>OPC</code> to <code>1</code> to enable</p>
 * <p><code>SetDymolaCompiler(&QUOT;vs&QUOT;, {&QUOT;CCompiler=MSVC&QUOT;, &QUOT;MSVCDir=C:/Program Files (x86)/Microsoft Visual Studio 10.0/Vc&QUOT;, &QUOT;<b>DLL=0</b>&QUOT;, &QUOT;<b>DDE=0</b>&QUOT; , &QUOT;<b>OPC=0</b>&QUOT;});</code></p>
 * <h4><span style="color:#008000">Linux</span></h4>
 * <p>This function is not supported on Linux.</p>
 * <p>When executed it returns <code>ok</code> without performing any action.</p></html>
 *
 * @param {String} compiler 
 * @param {Array} [settings={""}]  Dimension [:]. Default [""].
 * @throws {DymolaException}
 */
DymolaInterface.prototype.SetDymolaCompiler = function (compiler, settings) {
    settings = (settings === undefined) ? [""] : settings;
    var params = [];
    params.push(compiler);
    params.push(settings);
    this.callDymolaFunction("SetDymolaCompiler", params);
};

/**
 * <html><p>Highlights the given components in the diagram.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <pre>ShowComponent(&QUOT;Modelica.Blocks.Examples.PID_Controller&QUOT;,&nbsp;{&QUOT;inertia1&QUOT;,&nbsp;&QUOT;inertia2&QUOT;})</pre>
 * <p>will highlight <b>inertia1</b> and <b>inertia2</b> in the diagram layer of the example <code><b>Modelica.Blocks.Examples.PID_Controller</b></code>.</p>
 * <p><b>Note</b> that the model (PID_Controller) must first be selected in the Package Browser.</p></html>
 *
 * @param {String} path Path to component to show.
 * @param {Array} [components=array("" for i in 1:0)] Optional list of subcomponents to highlight. Dimension [:]. Default array("" for i in 1:0).
 * @returns {Boolean} ok
 * @throws {DymolaException}
 */
DymolaInterface.prototype.ShowComponent = function (path, components) {
    var params = [];
    if (path !== undefined) {
        params.push(new DymolaNamedArgument("path", path));
    }
    if (components !== undefined) {
        params.push(new DymolaNamedArgument("components", components));
    }
    var result = this.callDymolaFunction("ShowComponent", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>Show or hide the message window.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <pre>showMessageWindow(true)
 * showMessageWindow(false)</pre>
 * <p>to show or hide the message window.</p></html>
 *
 * @param {Boolean} show 
 * @returns {Boolean} ok
 * @throws {DymolaException}
 */
DymolaInterface.prototype.showMessageWindow = function (show) {
    var params = [];
    params.push(show);
    var result = this.callDymolaFunction("showMessageWindow", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * Returns the value of a signal operator for a given variable. The last result file is used.
 *
 * @param {String} variablePath Variable.
 * @param {Number} signalOperator Signal operator. See enumeration :class:`SignalOperator <dymola.dymola_enums.SignalOperator>` for available operators. Enumeration.
 * @param {Number} [startTime=-1E+100] Start time. By default the entire simulated interval is used. Default -1E+100.
 * @param {Number} [stopTime=1E+100] Stop time. By default the entire simulated interval is used. Default 1E+100.
 * @returns {Number} Returns the value of the signal operator
 * @throws {DymolaException}
 */
DymolaInterface.prototype.signalOperatorValue = function (variablePath, signalOperator, startTime, stopTime) {
    startTime = (startTime === undefined) ? -1E+100 : startTime;
    stopTime = (stopTime === undefined) ? 1E+100 : stopTime;
    var params = [];
    params.push(variablePath);
    params.push(signalOperator);
    params.push(startTime);
    params.push(stopTime);
    var result = this.callDymolaFunction("signalOperatorValue", params);
    return this.parseResponseAndReturn(result, "Number");
};

/**
 * <html><p>An extension of <code>simulateModel</code> (please see that routine, also for comparison between a number of similar routines). This routine gives the possibility to set parameters and startvalues before simulation and to get the final values at end-point of simulation. <code>autoLoad=true</code> is default. If false the result file is not loaded in the plot window (and variables are not replotted).</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <h5>Parameter studies of selected parameters</h5>
 * <p>Consider the demo model <code>Modelica.Mechanics.Rotational.CoupledClutches</code>. The parameters J1.J and J2.J should be varied and the resulting <code>J1.w</code> and <code>J4.w</code> should be measured and saved at the end of the simulation. That will be the result of the following function call:</p>
 * <p>Please note that you for this example first have to open the model (using <b>File &GT; Demos&hellip; &GT; Coupled Clutches</b>) since it is a read-only demo. Entering in the command input line (followed by enter):</p>
 * <pre>simulateExtendedModel(&QUOT;Modelica.Mechanics.Rotational.Examples.CoupledClutches&QUOT;,initialNames={&QUOT;J1.J&QUOT;,&QUOT;J2.J&QUOT;},initialValues={2, 3},finalNames={&QUOT;J1.w&QUOT;,&QUOT;J4.w&QUOT;});</pre>
 * <p>The output visible in the command window will be:</p>
 * <pre>&nbsp;=&nbsp;true,&nbsp;{6.213412958654301,&nbsp;0.9999999999999936}</pre>
 * <p>It can be seen that the function was executed successfully (<code>= true</code>); then the value of<code> J1.w</code> (6.213&hellip;) and <code>J4.w</code> (0.99999&hellip;) is presented.</p>
 * <p>By changing <code>J1.J</code> and <code>J2.J</code> and simulating the resulting <code>J1.w</code> and <code>J4.w</code> can be studied.</p></html>
 *
 * @param {String} problem Name of model, e.g. Modelica.Mechanics.Rotational.Components.Clutch.
 * @param {Number} startTime Start of simulation.
 * @param {Number} stopTime End of simulation.
 * @param {Number} numberOfIntervals Number of output points.
 * @param {Number} outputInterval Distance between output points.
 * @param {String} method Integration method.
 * @param {Number} tolerance Tolerance of integration.
 * @param {Number} fixedstepsize Fixed step size for Euler.
 * @param {String} resultFile Where to store result.
 * @param {Array} initialNames Parameters and start-values to set. Dimension [:].
 * @param {Array} initialValues Parameter values. Dimension [size(initialNames, 1)].
 * @param {Array} finalNames Variables at end-point. Dimension [:].
 * @param {Boolean} autoLoad Auto load result.
 * @returns {Array} true if successful (Boolean), Values at end-point (Array)
 * @throws {DymolaException}
 */
DymolaInterface.prototype.simulateExtendedModel = function (problem, startTime, stopTime, numberOfIntervals, outputInterval, method, tolerance, fixedstepsize, resultFile, initialNames, initialValues, finalNames, autoLoad) {
    var params = [];
    params.push(problem);
    params.push(startTime);
    params.push(stopTime);
    params.push(numberOfIntervals);
    params.push(outputInterval);
    params.push(method);
    params.push(tolerance);
    params.push(fixedstepsize);
    params.push(resultFile);
    params.push(initialNames);
    params.push(initialValues);
    params.push(finalNames);
    params.push(autoLoad);
    var result = this.callDymolaFunction("simulateExtendedModel", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * <html><p>Simulate the model for the given time. <code>method</code> is a string with the name of the integration algorithm; the names correspond to the ones found in the popup-menu and the string is case insensitive. <code>fixedstepsize</code> is only used if the method Euler is selected. Note that file extension is automatically added to <code>resultFile</code> (normally <code>&QUOT;.mat&QUOT;</code>). For backwards compatibility the default for <code>resultFile</code> is <code>&QUOT;dsres&QUOT;</code>.</p>
 * <p>The entire command corresponds to <b>Simulate</b> in the menus.</p>
 * <p>Values specified in the model will be used unless the corresponding modifier is given in the <code>simulateModel</code> command.</p>
 * <p>Note: <code>translateModel</code>, <code>simulateModel</code>, <code>simulateExtendedModel</code> , <code>simulateMultiExtendedModel</code>, and <code>simulateMultiResultsModel</code> have named arguments (as is indicated above) and the default for problem is &QUOT;&QUOT; corresponding to the most recently used model. Thus <code>simulateModel(stopTime=10,method=&QUOT;Euler&QUOT;);</code> corresponds to <code>simulateModel(&QUOT;&QUOT;, 0, 10, 0, 0, &QUOT;Euler&QUOT;, 1e-4);</code></p>
 * <p>It is possible to specify a model name with modifiers for translateModel, simulateModel and simulateExtendedModel.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <pre>for source in {&QUOT;Step&QUOT;,&QUOT;Constant&QUOT;,&QUOT;Ramp&QUOT;,&QUOT;Sine&QUOT;} loop
 * simulateModel(&QUOT;TestSource(redeclare Modelica.Blocks.Sources.&QUOT;+source+&QUOT; Source)&QUOT;);
 * end for;</pre>
 * <p>to simulate the model below with different sources.</p>
 * <p><code><font style="color: #0000ff; ">model</font>&nbsp;TestSource</code></p>
 * <p><code>&nbsp;&nbsp;<font style="color: #ff0000; ">Modelica.Blocks.Sources.Step</font>&nbsp;Source</code></p>
 * <p><code><font style="color: #0000ff; ">end&nbsp;</font>TestSource;</code></p></html>
 *
 * @param {String} [problem=""] Name of model, e.g. Modelica.Mechanics.Rotational.Components.Clutch. Default "".
 * @param {Number} [startTime=0.0] Start of simulation. Default 0.0.
 * @param {Number} [stopTime=1.0] End of simulation. Default 1.0.
 * @param {Number} [numberOfIntervals=0] Number of output points. Default 0.
 * @param {Number} [outputInterval=0.0] Distance between output points. Default 0.0.
 * @param {String} [method="Dassl"] Integration method. Default "Dassl".
 * @param {Number} [tolerance=0.0001] Tolerance of integration. Default 0.0001.
 * @param {Number} [fixedstepsize=0.0] Fixed step size for Euler. Default 0.0.
 * @param {String} [resultFile="dsres"] Where to store result. Default "dsres".
 * @returns {Boolean} true if successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.simulateModel = function (problem, startTime, stopTime, numberOfIntervals, outputInterval, method, tolerance, fixedstepsize, resultFile) {
    problem = (problem === undefined) ? "" : problem;
    startTime = (startTime === undefined) ? 0.0 : startTime;
    stopTime = (stopTime === undefined) ? 1.0 : stopTime;
    numberOfIntervals = (numberOfIntervals === undefined) ? 0 : numberOfIntervals;
    outputInterval = (outputInterval === undefined) ? 0.0 : outputInterval;
    method = (method === undefined) ? "Dassl" : method;
    tolerance = (tolerance === undefined) ? 0.0001 : tolerance;
    fixedstepsize = (fixedstepsize === undefined) ? 0.0 : fixedstepsize;
    resultFile = (resultFile === undefined) ? "dsres" : resultFile;
    var params = [];
    params.push(problem);
    params.push(startTime);
    params.push(stopTime);
    params.push(numberOfIntervals);
    params.push(outputInterval);
    params.push(method);
    params.push(tolerance);
    params.push(fixedstepsize);
    params.push(resultFile);
    var result = this.callDymolaFunction("simulateModel", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>An extension of <code>simulateModel</code> (please see that routine, also for comparison between a number of similar routines). The function handles a number of simulations. For each simulation it is possible to set parameters and start-values before simulation and to get the final values at end-point of simulation.</p>
 * <p>The function is valuable e.g. when wanting to study the best parameter setup or the robustness of a parameter setup for a static simulation (no states involved).</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <p>Entering in the command input line (followed by enter):</p>
 * <pre>simulateMultiExtendedModel(&QUOT;Modelica.Mechanics.Rotational.Examples.CoupledClutches&QUOT;, initialNames={&QUOT;J1.J&QUOT;,&QUOT;J2.J&QUOT;}, initialValues=[2,3;3,4;4,5], finalNames={&QUOT;J1.w&QUOT;, &QUOT;J4.w&QUOT;})</pre><p>The output visible in the command window will be:</p>
 * <pre>&nbsp;=&nbsp;true,&nbsp;
 * [6.213412958654301,&nbsp;0.9999999999999936;
 *  7.483558191010656,&nbsp;1.0000000000000024;
 *  8.107446379737777,&nbsp;0.9999999999999951]</pre>
 * 
 * </html>
 *
 * @param {String} problem Name of model, e.g. Modelica.Mechanics.Rotational.Components.Clutch.
 * @param {Number} startTime Start of simulation.
 * @param {Number} stopTime End of simulation.
 * @param {Number} numberOfIntervals Number of output points.
 * @param {Number} outputInterval Distance between output points.
 * @param {String} method Integration method.
 * @param {Number} tolerance Tolerance of integration.
 * @param {Number} fixedstepsize Fixed step size for Euler.
 * @param {String} resultFile Where to store result.
 * @param {Array} initialNames Parameters and start-values to set. Dimension [:].
 * @param {Array} initialValues Parameter values. Dimension [:, size(initialNames, 1)].
 * @param {Array} finalNames Variables at end-point. Dimension [:].
 * @returns {Array} true if successful (Boolean), Values at end-point (Array)
 * @throws {DymolaException}
 */
DymolaInterface.prototype.simulateMultiExtendedModel = function (problem, startTime, stopTime, numberOfIntervals, outputInterval, method, tolerance, fixedstepsize, resultFile, initialNames, initialValues, finalNames) {
    var params = [];
    params.push(problem);
    params.push(startTime);
    params.push(stopTime);
    params.push(numberOfIntervals);
    params.push(outputInterval);
    params.push(method);
    params.push(tolerance);
    params.push(fixedstepsize);
    params.push(resultFile);
    params.push(initialNames);
    params.push(initialValues);
    params.push(finalNames);
    var result = this.callDymolaFunction("simulateMultiExtendedModel", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * <html><p>An extension of <code>simulateModel</code> (please see that routine, also for comparison between a number of similar routines).</p>
 * <p>Compared to <code>simulateMultiExtendedModel</code> this function stores the full trajectories of several simulations instead of just the endpoints.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <p>(storing the output in the two variables <code>ok</code> and <code>traj</code> to avoid cluttering the Commands window)</p>
 * <pre>(ok,traj)=simulateMultiResultsModel(&QUOT;Modelica.Mechanics.Rotational.Examples.CoupledClutches&QUOT;, stopTime=1.2, numberOfIntervals=10, resultFile=&QUOT;CoupleCluches&QUOT;, initialNames={&QUOT;freqHz&QUOT;}, initialValues=[0.1;0.2;0.3;0.4], resultNames={&QUOT;J1.w&QUOT;,&QUOT;J3.w&QUOT;});</pre>
 * <p>results in</p>
 * <pre>Declaring&nbsp;variable:&nbsp;Boolean&nbsp;ok&nbsp;;
 * Declaring&nbsp;variable:&nbsp;Real&nbsp;traj&nbsp;[4,&nbsp;2,&nbsp;11];</pre>
 * <p>where <code>traj</code> contains the two trajectories for <code>J1.w</code> and <code>J3.w</code> (11 result points) for the 4 caseses of initialvalues of <code>freqHz</code>.</p></html>
 *
 * @param {String} problem Name of model, e.g. Modelica.Mechanics.Rotational.Components.Clutch.
 * @param {Number} startTime Start of simulation.
 * @param {Number} stopTime End of simulation.
 * @param {Number} numberOfIntervals Number of output points.
 * @param {Number} outputInterval Distance between output points.
 * @param {String} method Integration method.
 * @param {Number} tolerance Tolerance of integration.
 * @param {Number} fixedstepsize Fixed step size for Euler.
 * @param {String} resultFile Where to store result.
 * @param {Array} initialNames Parameters and start-values to set. Dimension [:].
 * @param {Array} initialValues Parameter values. Dimension [:, size(initialNames, 1)].
 * @param {Array} resultNames Variables during simulation. Dimension [:].
 * @returns {Array} true if successful (Boolean), Values at end-point (Array)
 * @throws {DymolaException}
 */
DymolaInterface.prototype.simulateMultiResultsModel = function (problem, startTime, stopTime, numberOfIntervals, outputInterval, method, tolerance, fixedstepsize, resultFile, initialNames, initialValues, resultNames) {
    var params = [];
    params.push(problem);
    params.push(startTime);
    params.push(stopTime);
    params.push(numberOfIntervals);
    params.push(outputInterval);
    params.push(method);
    params.push(tolerance);
    params.push(fixedstepsize);
    params.push(resultFile);
    params.push(initialNames);
    params.push(initialValues);
    params.push(resultNames);
    var result = this.callDymolaFunction("simulateMultiResultsModel", params);
    return this.parseResponseAndReturn(result, "Array");
};

/**
 * <html><p>Execute system commands.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <p>Execute</p>
 * <pre>system(&QUOT;time&nbsp;/t&nbsp;&GT;&GT;&nbsp;time.txt&QUOT;);</pre>
 * <p>to print the current time to a file, <code>time.txt</code>, in the current directory.</p></html>
 *
 * @param {String} _command Command to execute.
 * @returns {Boolean} Command ok
 * @throws {DymolaException}
 */
DymolaInterface.prototype.system = function (_command) {
    var params = [];
    params.push(_command);
    var result = this.callDymolaFunction("system", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>Function to trace execution of interactive functions, helps in finding errors.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <p>For the following small function</p>
 * <p><font style="color: #0000ff; ">function</font>&nbsp;Test</p>
 * <p>&nbsp;&nbsp;<font style="color: #0000ff; ">input&nbsp;</font><font style="color: #ff0000; ">Real</font>&nbsp;val;</p>
 * <p>&nbsp;&nbsp;<font style="color: #0000ff; ">output&nbsp;</font><font style="color: #ff0000; ">Real</font>&nbsp;out1,out2;</p>
 * <p><font style="color: #0000ff; ">algorithm&nbsp;</font></p>
 * <p>&nbsp;&nbsp;out1:=<font style="color: #ff0000; ">sin</font>(val);</p>
 * <p>&nbsp;&nbsp;out2:=<font style="color: #ff0000; ">cos</font>(val);</p>
 * <p><font style="color: #0000ff; ">end&nbsp;</font>Test;</p>
 * <p>Setting trace(variables=true,&nbsp;statements=true,&nbsp;calls=true,&nbsp;profile=true) and then executing Test(0.3); </p>
 * <p><code>Trace&nbsp;statement:&nbsp;<a href="Modelica://Test">Test</a>(0.3);</code></p>
 * <pre>Trace&nbsp;in&nbsp;Test&nbsp;:&nbsp;start&nbsp;of&nbsp;call.
 * Trace&nbsp;in&nbsp;Test&nbsp;variable:&nbsp;out1&nbsp;=&nbsp;0.0
 * Trace&nbsp;in&nbsp;Test&nbsp;variable:&nbsp;out2&nbsp;=&nbsp;0.0
 * <p><code></p><p>Trace&nbsp;in&nbsp;Test&nbsp;statement:&nbsp;out1&nbsp;:=&nbsp;<a href="Modelica://sin">sin</a>(val);</code></p>
 * <pre>Trace&nbsp;in&nbsp;Test&nbsp;variable:&nbsp;out1&nbsp;=&nbsp;0.29552020666133955
 * <p><code></p><p>Trace&nbsp;in&nbsp;Test&nbsp;statement:&nbsp;out2&nbsp;:=&nbsp;<a href="Modelica://cos">cos</a>(val);</code></p>
 * <pre>Trace&nbsp;in&nbsp;Test&nbsp;variable:&nbsp;out2&nbsp;=&nbsp;0.955336489125606
 * Trace&nbsp;in&nbsp;Test&nbsp;:&nbsp;end&nbsp;of&nbsp;call.
 * &nbsp;=&nbsp;0.29552020666133955,&nbsp;0.955336489125606</pre>
 * <p>Output of result above.</p></html>
 *
 * @param {Boolean} [variables=false] Trace assignments to variables. Default false.
 * @param {Boolean} [statements=false] Trace all statements. Default false.
 * @param {Boolean} [calls=false] Trace function calls. Default false.
 * @param {String} [onlyFunction=""] Name of function this is limited to. Default "".
 * @param {Boolean} [profile=false] Profile function (time and #calls). Default false.
 * @throws {DymolaException}
 */
DymolaInterface.prototype.trace = function (variables, statements, calls, onlyFunction, profile) {
    variables = (variables === undefined) ? false : variables;
    statements = (statements === undefined) ? false : statements;
    calls = (calls === undefined) ? false : calls;
    onlyFunction = (onlyFunction === undefined) ? "" : onlyFunction;
    profile = (profile === undefined) ? false : profile;
    var params = [];
    params.push(variables);
    params.push(statements);
    params.push(calls);
    params.push(onlyFunction);
    params.push(profile);
    this.callDymolaFunction("trace", params);
};

/**
 * <html><p>Compile the model (with current settings). This corresponds to <b>Translate</b> (Normal) in the menus.</p></html>
 *
 * @param {String} problem Name of model, e.g. Modelica.Mechanics.Rotational.Components.Clutch.
 * @returns {Boolean} true if successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.translateModel = function (problem) {
    var params = [];
    params.push(problem);
    var result = this.callDymolaFunction("translateModel", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>Translates the active model to code executable on any platform without a Dymola license at the target system.</p>
 * <p>This built-in function corresponds to the command <b>Simulation &GT; Translate &GT; Export</b>, and corresponding drop-down selection of the <b>Translate</b> button.</p>
 * <p>This functionality demands license. For more information, please see the manual &ldquo;Dymola User Manual Volume 2&rdquo;, chapter 6 &ldquo;Other Simulation Environments&rdquo;, section &ldquo;Code and Model Export&rdquo;.</p></html>
 *
 * @param {String} modelName Model to open.
 * @returns {Boolean} true if successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.translateModelExport = function (modelName) {
    var params = [];
    params.push(modelName);
    var result = this.callDymolaFunction("translateModelExport", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>Translates a model to an FMU. The input string <code>model</code> defines the model to open in the same way as the traditional <code>translateModel</code> command in Dymola.</p>
 * <p>The Boolean input <code>storeResult</code> is used to specify if the FMU should generate a result file (<code>dsres.mat</code>). If <code>storeResult</code> is true, the result is saved in <code>&LT;model id&GT;</code>.mat when the FMU is imported and simulated, where<code> &LT;model id&GT;</code> is given at FMU initialization. (If empty, <code>&ldquo;dsres&rdquo;</code> is used instead.) This is useful when importing FMUs with parameter <code>allVariables = false</code>, since it provides a way to still obtain the result for all variables. Simultaneous use of result storing and source code inclusion (see below) is not supported.</p>
 * <p>The input string <code>modelName</code> is used to select the FMU model identifier. If the string is empty, the model identifier will be the name of the model, adapted to the syntax of model identifier (e.g. dots will be exchanged with underscores).The name must only contain letters, digits and underscores. It must not begin with a digit.</p>
 * <p>The input string <code>fmiVersion</code> controls the FMI version (<code>&QUOT;1&QUOT;</code> or <code>&QUOT;2&QUOT;</code>) of the FMU. The default is <code>&QUOT;1&QUOT;</code>.</p>
 * <p>The input string <code>fmiType</code> define whether the model should be exported as</p>
 * <ul>
 * <li>Model exchange (<code>fmiType=&QUOT;me&QUOT;</code>)</li>
 * <li>Co-simulation using Cvode (<code>fmiType=&QUOT;cs&QUOT;</code>)</li>
 * <li>Both model exchange, and Co-simulation using Cvode (<code>fmiType=&QUOT;all&QUOT;</code>)</li>
 * <li>Co-simulation using Dymola solvers (<code>fmiType=&QUOT;csSolver&QUOT;</code>).</li>
 * </ul>
 * <p>The default setting is <code>fmiType=&QUOT;all&QUOT;</code>. This parameter primarily affects modelDescription.xml. For the three first choices binary and source code always contains both model exchange and Co-simulation. For the last choice the binary code only contains Co-simulation. Note &ndash; Co-simulation using Dymola solvers requires Binary Model Export license, and is currently only available on Windows, for FMI version 1.0. For this option it might also be noted that also the selected tolerance in Dymola will be used by the Cosimulation FMU, and, source code generation FMU is not supported by this alternative.</p>
 * <p>The Boolean input <code>includeSource</code> is used to specify if source code should be included in the FMU. The default setting is that it is not included (<code>includeSource=false</code>). Simultaneous use of result storing (see above) and source code inclusion is not supported.</p>
 * <p>The function outputs a string <code>FMUName</code> containing the FMU model identifier on success, otherwise an empty string.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <p>Translating the Modelica CoupledClutches demo model to an FMU with result file generation, is accomplished by the function call</p>
 * <pre>translateModelFMU(&QUOT;Modelica.Mechanics.Rotational.Examples. CoupledClutches&QUOT;, true);</pre>
 * <p>After successful translation, the generated FMU (with file extension .fmu) will be located in the current directory. Exporting an FMU using the 64-bit version of Dymola will create both32-bit and 64-bit binaries if possible.</p>
 * <p>The <code>translateModelFMU</code> command will generate an FMU that supports both the FMI for Model Exchange specification and the FMI for Co-Simulation slave interface (all functions will be present in the DLL).</p>
 * <p>On Linux, note that FMU export requires the Linux utility &ldquo;zip&rdquo;. If not already installed, please install using your packaging manager (e.g. apt-get) or see e.g. http://infozip.org/Zip.html.</p>
 * <p>This built-in function corresponds to the commands <b>Simulation &GT; Translate &GT; FMU</b> and corresponding drop-down selections of the <b>Translate</b> button.</p>
 * <p>For more information about FMI, please see the manual &ldquo;Dymola User Manual Volume 2&rdquo;, chapter 6 &ldquo;Other Simulation Environments&rdquo;, section &ldquo;FMI Support in Dymola&rdquo;.</p></html>
 *
 * @param {String} modelToOpen Model to open.
 * @param {Boolean} [storeResult=false] Whether to store result in mat file from within FMU. Default false.
 * @param {String} [modelName=""] User-selected FMU modelIdentifier (also used as modelName). Default "".
 * @param {String} [fmiVersion="1"] FMI version, 1 or 2. Default "1".
 * @param {String} [fmiType="all"] FMI type, me (model exchange), cs (co-simulation) or all.  Only affects modelDescription.xml; binary and source code always contain both. Default "all".
 * @param {Boolean} [includeSource=false] Whether to include source code in FMU. Default false.
 * @returns {String} FMI model identifier on success, empty string on failure
 * @throws {DymolaException}
 */
DymolaInterface.prototype.translateModelFMU = function (modelToOpen, storeResult, modelName, fmiVersion, fmiType, includeSource) {
    storeResult = (storeResult === undefined) ? false : storeResult;
    modelName = (modelName === undefined) ? "" : modelName;
    fmiVersion = (fmiVersion === undefined) ? "1" : fmiVersion;
    fmiType = (fmiType === undefined) ? "all" : fmiType;
    includeSource = (includeSource === undefined) ? false : includeSource;
    var params = [];
    params.push(modelToOpen);
    params.push(storeResult);
    params.push(modelName);
    params.push(fmiVersion);
    params.push(fmiType);
    params.push(includeSource);
    var result = this.callDymolaFunction("translateModelFMU", params);
    return this.parseResponseAndReturn(result, "String");
};

/**
 * <html><p>Works as the function <code>list</code>, but does not list interactive settings of translator switches. See <code>list</code> for more documentation</p></html>
 *
 * @param {String} [filename=""]  Default "".
 * @param {Array} [variables={"*"}] Select a subset of the variables. Wildcards * and ? may be used. Dimension [:]. Default ["*"].
 * @throws {DymolaException}
 */
DymolaInterface.prototype.variables = function (filename, variables) {
    filename = (filename === undefined) ? "" : filename;
    variables = (variables === undefined) ? ["*"] : variables;
    var params = [];
    params.push(filename);
    params.push(variables);
    this.callDymolaFunction("variables", params);
};

/**
 * <html><p>Make a 3d visualization of the initial configuration of a model, same functionality as <b>Simulation &GT; Visualize</b>.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <pre>visualize3dModel(&QUOT;Modelica.Mechanics.MultiBody.Examples.Elementary.DoublePendulum&QUOT;)</pre>
 * <p>to make a 3d visualization of the DoublePendulum model.</p></html>
 *
 * @param {String} problem Name of model, e.g. Modelica.Mechanics.Rotational.Components.Clutch.
 * @returns {Boolean} true if successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.visualize3dModel = function (problem) {
    var params = [];
    params.push(problem);
    var result = this.callDymolaFunction("visualize3dModel", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>Write one real-valued matrix expression to a file. Vectors and scalar expression must be converted by enclosing them in [ ]. Arrays of matrices cannot currently be written. The file format is Matlab v4.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <p>Execute <code>writeMatrix(&QUOT;A.mat&QUOT;,&nbsp;&QUOT;data&QUOT;,&nbsp;[1,&nbsp;2;&nbsp;3,&nbsp;4])</code> to write [1, 2; 3, 4] to a matrix <code>data</code> in the file <code>A.mat</code>.</p>
 * <p>Execute <code>writeMatrix(&QUOT;A.mat&QUOT;,&nbsp;&QUOT;data_2&QUOT;,&nbsp;[5,&nbsp;6;&nbsp;7,&nbsp;8], true)</code> to write [5, 6; 7, 8] to a matrix <code>data_2</code> and append it in the file <code>A.mat</code>.</p>
 * <p><code>A.mat</code> now contains both <code>data</code> and <code>data_2.</code></p>
 * <p>Execute <code>writeMatrix(&QUOT;A.mat&QUOT;,&nbsp;&QUOT;data_2&QUOT;,&nbsp;[5,&nbsp;6;&nbsp;7,&nbsp;8])</code> (without the last argument append=true) will overwrite the content of A.mat and it will now only contain data_2.</p></html>
 *
 * @param {String} fileName File that will contain the matrix, e.g. A.mat.
 * @param {String} matrixName Name of the matrix in the file.
 * @param {Array} matrix Data to be written, use [A] to convert vector or scalar to matrix. Dimension [:, :].
 * @param {Boolean} [append=false] Append data to file. Default false.
 * @returns {Boolean} true if successful
 * @throws {DymolaException}
 */
DymolaInterface.prototype.writeMatrix = function (fileName, matrixName, matrix, append) {
    append = (append === undefined) ? false : append;
    var params = [];
    params.push(fileName);
    params.push(matrixName);
    params.push(matrix);
    params.push(append);
    var result = this.callDymolaFunction("writeMatrix", params);
    return this.parseResponseAndReturn(result, "Boolean");
};

/**
 * <html><p>Writes a trajectory file based on values. Useful for generating input signals.</p>
 * <h4><span style="color:#008000">Example</span></h4>
 * <p>Execute</p>
 * <pre>writeTrajectory(&QUOT;A.mat&QUOT;,&nbsp;{&QUOT;Time&QUOT;,&nbsp;&QUOT;u1&QUOT;},&nbsp;[0,&nbsp;0;&nbsp;0.1,&nbsp;0.099;&nbsp;0.2,&nbsp;0.198;&nbsp;0.3,&nbsp;0.295;&nbsp;0.4,&nbsp;0.389;&nbsp;0.5,&nbsp;0.479;&nbsp;0.5,&nbsp;0.479;&nbsp;0.6,&nbsp;0.564;&nbsp;0.7,&nbsp;0.644;&nbsp;0.8,&nbsp;0.717;&nbsp;0.9,&nbsp;0.783;&nbsp;1.0,&nbsp;0.841])</pre>
 * <p>to write the trajectory sin(linspace(0:1:11)) as a variable <code>u1</code> to a file <code>A.mat</code> with an event at Time=0.5 (duplicate trajectory points).</p></html>
 *
 * @param {String} fileName File to store trajectory in, e.g. dsu.txt.
 * @param {Array} signals Vector of variable names, in Modelica-syntax, e.g a[1].b. Dimension [:].
 * @param {Array} values Values of the signals, duplicate times indicate before and after event. Dimension [:, size(signals, 1)].
 * @throws {DymolaException}
 */
DymolaInterface.prototype.writeTrajectory = function (fileName, signals, values) {
    var params = [];
    params.push(fileName);
    params.push(signals);
    params.push(values);
    this.callDymolaFunction("writeTrajectory", params);
};
