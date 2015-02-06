within ;
package Engine1cyl 
  model Unnamed
  end Unnamed;


  model Engine_Base

  import MBS = Modelica.Mechanics.MultiBody;

  replaceable CATIAMultiBody.Parts.BodyShapeWithFrames 'GlobalBody'(
    m=0.,
    r_CM={0.,0.,0.},
    I_11=1.e-6,
    I_21=0.,
    I_31=0.,
    I_22=1.e-6,
    I_32=0.,
    I_33=1.e-6,
    shapeType="modelica://Engine1cyl/Engine_Base/GlobalBody.wrl",
    color={255,255,255},
    IconName="modelica://Engine1cyl/Engine_Base/GlobalBody.png",
    nbFrames=2,
    bodyFramesProperties={CATIAMultiBody.Parts.FrameProperties(
          r={0.,0.,0.},
          n_x={1.,0.,0.},
          n_y={0.,1.,0.}),CATIAMultiBody.Parts.FrameProperties(
          r={0,0,0},
          n_x={1,0,0},
          n_y={0,1,0})}) constrainedby
    CATIAMultiBody.Parts.PartialArrayOfFrames "GlobalBody" annotation (
      Placement(transformation(extent={{-30,-30},{30,30}}, origin={-90.,10.})));
  replaceable CATIAMultiBody.Parts.BodyShapeWithFrames 'Master_One_Cylinder'(
    m=0.76592947524482,
    r_CM={-4.5e-2,0.,0.},
    I_11=4.9983447376224e-4,
    I_21=0.,
    I_31=0.,
    I_22=3.0736194752448e-4,
    I_32=0.,
    I_33=3.0736194752448e-4,
    shapeType="modelica://Engine1cyl/Engine_Base/Master_One_Cylinder.wrl",
    color={255,255,255},
    IconName="modelica://Engine1cyl/Engine_Base/Master_One_Cylinder.png",
    nbFrames=4,
    bodyFramesProperties={CATIAMultiBody.Parts.FrameProperties(
          r={0.,0.,0.},
          n_x={1.,0.,0.},
          n_y={0.,1.,0.}),CATIAMultiBody.Parts.FrameProperties(
          r={-4.5e-2,0.,0.},
          n_x={1.,0.,0.},
          n_y={0.,1.,0.}),CATIAMultiBody.Parts.FrameProperties(
          r={0.,-0.16920647088485,0.},
          n_x={1.,0.,0.},
          n_y={0.,1.,0.}),CATIAMultiBody.Parts.FrameProperties(
          r={0.,0.,0.},
          n_x={1.,0.,0.},
          n_y={0.,1.,0.})}) constrainedby
    CATIAMultiBody.Parts.PartialArrayOfFrames
    "Engine_Study_Fixed A.1/Master_One_Cylinder" annotation (Placement(
        transformation(extent={{-30,-30},{30,30}}, origin={-90.,130.})));
  replaceable CATIAMultiBody.Parts.BodyShapeWithFrames 'Rod_Study'(
    m=0.15261168082752,
    r_CM={0.,-8.9431700693962e-2,2.4489282256523e-2},
    I_11=2.0123294205418e-4,
    I_21=0.,
    I_31=0.,
    I_22=3.7032858121938e-5,
    I_32=-7.248058569384e-5,
    I_33=1.6674361194603e-4,
    shapeType="modelica://Engine1cyl/Engine_Base/Rod_Study.wrl",
    color={255,255,255},
    IconName="modelica://Engine1cyl/Engine_Base/Rod_Study.png",
    nbFrames=2,
    bodyFramesProperties={CATIAMultiBody.Parts.FrameProperties(
          r={0.,-3.465692988818e-2,4.8978561933508e-2},
          n_x={1.,0.,0.},
          n_y={0.,1.,0.}),CATIAMultiBody.Parts.FrameProperties(
          r={0.,-0.14420647088485,0.},
          n_x={1.,0.,0.},
          n_y={0.,1.,0.})}) constrainedby
    CATIAMultiBody.Parts.PartialArrayOfFrames
    "Engine_Study_Fixed A.1/Rod_Study" annotation (Placement(transformation(
          extent={{-30,-30},{30,30}}, origin={-90.,370.})));
  replaceable CATIAMultiBody.Parts.BodyShapeWithFrames 'Cranck_Study'(
    m=0.27143430732505,
    r_CM={-2.7059782294607e-2,-9.069185701765e-3,1.2816934402476e-2},
    I_11=1.5062573963964e-4,
    I_21=4.8340727106631e-5,
    I_31=-6.8317085597444e-5,
    I_22=2.264217177783e-4,
    I_32=6.4105778274046e-5,
    I_33=1.8118573310069e-4,
    shapeType="modelica://Engine1cyl/Engine_Base/Cranck_Study.wrl",
    color={255,255,255},
    IconName="modelica://Engine1cyl/Engine_Base/Cranck_Study.png",
    nbFrames=2,
    bodyFramesProperties={CATIAMultiBody.Parts.FrameProperties(
          r={0.,-3.465692988818e-2,4.8978561933508e-2},
          n_x={1.,0.,0.},
          n_y={0.,1.,0.}),CATIAMultiBody.Parts.FrameProperties(
          r={-4.5e-2,0.,0.},
          n_x={1.,0.,0.},
          n_y={0.,1.,0.})}) constrainedby
    CATIAMultiBody.Parts.PartialArrayOfFrames
    "Engine_Study_Fixed A.1/Cranck_Study" annotation (Placement(transformation(
          extent={{-30,-30},{30,30}}, origin={-90.,250.})));
  replaceable CATIAMultiBody.Parts.BodyShapeWithFrames 'Piston_Study'(
    m=0.30832450309994,
    r_CM={0.,-0.15149054405043,0.},
    I_11=7.2222774758231e-5,
    I_21=0.,
    I_31=0.,
    I_22=6.591552314855e-5,
    I_32=0.,
    I_33=7.703338864726e-5,
    shapeType="modelica://Engine1cyl/Engine_Base/Piston_Study.wrl",
    color={255,255,255},
    IconName="modelica://Engine1cyl/Engine_Base/Piston_Study.png",
    nbFrames=3,
    bodyFramesProperties={CATIAMultiBody.Parts.FrameProperties(
          r={0.,-0.14420647088485,0.},
          n_x={1.,0.,0.},
          n_y={0.,1.,0.}),CATIAMultiBody.Parts.FrameProperties(
          r={0.,-0.16920647088485,0.},
          n_x={1.,0.,0.},
          n_y={0.,1.,0.}),CATIAMultiBody.Parts.FrameProperties(
          r={0.,-0.16920647088485,0.},
          n_x={1.,0.,0.},
          n_y={0.,1.,0.})}) constrainedby
    CATIAMultiBody.Parts.PartialArrayOfFrames
    "Engine_Study_Fixed A.1/Piston_Study" annotation (Placement(transformation(
          extent={{-30,-30},{30,30}}, origin={-90.,490.})));

  replaceable CATIAMultiBody.Joints.Rigid 'Fix__2'(
    n_x_a={1.,0.,0.},
    n_y_a={0.,1.,0.},
    n_x_b={1.,0.,0.},
    n_y_b={0.,1.,0.}) constrainedby
    Modelica.Mechanics.MultiBody.Interfaces.PartialTwoFrames "Fix.2"
    annotation (Placement(transformation(
        extent={{-16,-16},{16,16}},
        origin={-60.,70.},
        rotation=90)));
  replaceable CATIAMultiBody.Joints.Revolute 'Revolute__6'(
    n_x_a={0.,0.,-1.},
    n_y_a={0.,1.,0.},
    n_x_b={0.,0.,-1.},
    n_y_b={0.,1.,0.},
    n={0.,0.,1.},
    phi_start=0.) constrainedby
    Modelica.Mechanics.MultiBody.Interfaces.PartialTwoFrames "Revolute.6"
    annotation (Placement(transformation(
        extent={{-16,-16},{16,16}},
        origin={-60.,310.},
        rotation=270)));
  replaceable CATIAMultiBody.Joints.Revolute 'Revolute__7'(
    n_x_a={0.,0.,-1.},
    n_y_a={0.,1.,0.},
    n_x_b={0.,0.,-1.},
    n_y_b={0.,1.,0.},
    n={0.,0.,1.},
    phi_start=0.) constrainedby
    Modelica.Mechanics.MultiBody.Interfaces.PartialTwoFrames "Revolute.7"
    annotation (Placement(transformation(
        extent={{-16,-16},{16,16}},
        origin={-60.,190.},
        rotation=90)));
  replaceable CATIAMultiBody.Joints.Revolute 'Revolute__8'(
    n_x_a={0.,0.,-1.},
    n_y_a={0.,1.,0.},
    n_x_b={0.,0.,-1.},
    n_y_b={0.,1.,0.},
    n={0.,0.,1.},
    phi_start=0.) constrainedby
    Modelica.Mechanics.MultiBody.Interfaces.PartialTwoFrames "Revolute.8"
    annotation (Placement(transformation(
        extent={{-16,-16},{16,16}},
        origin={-60.,430.},
        rotation=270)));
  replaceable CATIAMultiBody.Joints.Prismatic 'Prismatic__9'(
    n_x_b={0.,0.,-1.},
    n_y_b={1.,0.,0.},
    n={0.,0.,1.},
    s_start=0.,
    useAxisFlange=true) constrainedby
    Modelica.Mechanics.MultiBody.Interfaces.PartialTwoFrames "Prismatic.9"
    annotation (Placement(transformation(
        extent={{-16,-16},{16,16}},
        origin={-60.,550.},
        rotation=270)));
  replaceable CATIAMultiBody.Joints.Rigid 'MainAxis'(n_x_a={1.,0.,0.}, n_y_a={
        0.,1.,0.}) constrainedby
    Modelica.Mechanics.MultiBody.Interfaces.PartialTwoFrames "MainAxis"
    annotation (Placement(transformation(
        extent={{-16,-16},{16,16}},
        origin={260.,190.},
        rotation=90)));
  MBS.Interfaces.Frame_a 'MainAxis_frame' annotation (Placement(transformation(
        extent={{-15,-15},{15,15}},
        origin={260.,686.},
        rotation=-90), iconTransformation(
        extent={{-60,-60},{60,60}},
        origin={260.,686.},
        rotation=-90)));
  replaceable CATIAMultiBody.Joints.Rigid 'PistonForceAxis'(n_x_a={1.,0.,0.},
      n_y_a={0.,1.,0.}) constrainedby
    Modelica.Mechanics.MultiBody.Interfaces.PartialTwoFrames "PistonForceAxis"
    annotation (Placement(transformation(
        extent={{-16,-16},{16,16}},
        origin={100.,550.},
        rotation=90)));
  MBS.Interfaces.Frame_a 'PistonForceAxis_frame' annotation (Placement(
        transformation(
        extent={{-15,-15},{15,15}},
        origin={100.,686.},
        rotation=-90), iconTransformation(
        extent={{-60,-60},{60,60}},
        origin={100.,686.},
        rotation=-90)));
  CATIAMultiBody.Joints.RotatedCutJoint 'CutJoint'(n_x_b={0.,0.,-1.}, n_y_b={1.,
        0.,0.}) "Prismatic.9" annotation (Placement(transformation(
        extent={{-16,-16},{16,16}},
        origin={-60.,610.},
        rotation=90)));

  equation
  connect('Master_One_Cylinder'.frame_a[1], 'Fix__2'.frame_b)
    annotation (Line(points={{-60,126.4},{-60,86}}));
  connect('GlobalBody'.frame_a[1], 'Fix__2'.frame_a)
    annotation (Line(points={{-60,7.6},{-60,54}}));
  connect('Cranck_Study'.frame_a[1], 'Revolute__6'.frame_b)
    annotation (Line(points={{-60,247.6},{-60,294}}));
  connect('Rod_Study'.frame_a[1], 'Revolute__6'.frame_a)
    annotation (Line(points={{-60,367.6},{-60,326}}));
  connect('Cranck_Study'.frame_a[2], 'Revolute__7'.frame_b)
    annotation (Line(points={{-60,252.4},{-60,206}}));
  connect('Master_One_Cylinder'.frame_a[2], 'Revolute__7'.frame_a)
    annotation (Line(points={{-60,128.8},{-60,174}}));
  connect('Rod_Study'.frame_a[2], 'Revolute__8'.frame_b)
    annotation (Line(points={{-60,372.4},{-60,414}}));
  connect('Piston_Study'.frame_a[1], 'Revolute__8'.frame_a)
    annotation (Line(points={{-60,486.8},{-60,446}}));
  connect('Piston_Study'.frame_a[2], 'Prismatic__9'.frame_b)
    annotation (Line(points={{-60,490},{-60,534}}));
  connect('Master_One_Cylinder'.frame_a[4], 'MainAxis'.frame_a)
    annotation (Line(points={{-60,133.6},{260,133.6},{260,174}}));
  connect('MainAxis'.frame_b, 'MainAxis_frame')
    annotation (Line(points={{260,206},{260,686}}));
  connect('Piston_Study'.frame_a[3], 'PistonForceAxis'.frame_a)
    annotation (Line(points={{-60,493.2},{100,493.2},{100,534}}));
  connect('PistonForceAxis'.frame_b, 'PistonForceAxis_frame')
    annotation (Line(points={{100,566},{100,686}}));
  connect('Master_One_Cylinder'.frame_a[3], 'CutJoint'.frame_b) annotation (
      Line(points={{-60,131.2},{-28,131.2},{-28,636},{-60,636},{-60,626}},
        color={255,0,0}));
  connect('Prismatic__9'.frame_a, 'CutJoint'.frame_a)
    annotation (Line(points={{-60,566},{-60,594}}));

  annotation (
    Diagram(coordinateSystem(extent=[-250.,-170.; 436.,686.])),
    Icon(coordinateSystem(initialScale=0.11682242990654, extent=[-250.,-170.;
            436.,686.]), graphics={Rectangle(
          extent=[-250.,-170.; 436.,686.],
          lineColor={0,0,0},
          lineThickness=0,
          fillPattern=FillPattern.Solid,
          fillColor={255,255,255}), Bitmap(extent=[-250.,-170.; 436.,686.],
            fileName="modelica://Engine1cyl/Engine_Base/Engine_Base_icon.png")}),

    Documentation(info=
          "<html><h2>Code generation information</h2><h2>Originating model</h2><p>This Modelica code has been automatically generated on Friday, February 06, 2015 4:07:22 PM from the following context:</p><table border=1 cellspacing=0 cellpadding=2><tr><td>Applicability Date</td><td>0</td></tr><tr><td>Applicable in Projects</td><td></td></tr><tr><td>Authority Control</td><td>false</td></tr><tr><td>Change History</td><td>false</td></tr><tr><td>Collaborative Policy</td><td>VPLM_SMB_Definition</td></tr><tr><td>Collaborative Space</td><td>b l e u showcar</td></tr><tr><td>Created From</td><td>prd-R1132100123875-00000793 </td></tr><tr><td>Creation date</td><td>1423154910</td></tr><tr><td>Customer Discipline</td><td></td></tr><tr><td>Description</td><td></td></tr><tr><td>Design Range</td><td>NormalScale</td></tr><tr><td>Discipline</td><td></td></tr><tr><td>Is Best So Far</td><td>true</td></tr><tr><td>Is Last Version</td><td>true</td></tr><tr><td>Is Locked</td><td>false</td></tr><tr><td>Is Published</td><td>false</td></tr><tr><td>Is Terminal</td><td>false</td></tr><tr><td>Last modification</td><td>1423215160</td></tr><tr><td>Lock Owner</td><td></td></tr><tr><td>Major Version</td><td>A</td></tr><tr><td>Maturity</td><td>IN_WORK</td></tr><tr><td>Minor Version</td><td>1</td></tr><tr><td>Name</td><td>prd-R1132100151489-00049063</td></tr><tr><td>Nature</td><td>Definition</td></tr><tr><td>Organization</td><td>Company Name</td></tr><tr><td>Physical Control</td><td>true</td></tr><tr><td>Responsible</td><td>typ</td></tr><tr><td>Revision</td><td>A.1</td></tr><tr><td>Revision Comment</td><td></td></tr><tr><td>Security Level</td><td>0</td></tr><tr><td>Title</td><td>Engine_Study_Fixed</td></tr><tr><td>Usage</td><td></td></tr></table></html>"));
  end Engine_Base;


  model Engine "Results of selecting conditional constraints and/or states"
    extends Engine1cyl.Engine_Base('CutJoint'(cutJoint(conditions={true,false,true,false,true,false}, automatic={false,false,false,false,false,false})));
    Modelica.Mechanics.Rotational.Interfaces.Flange_a flange_a annotation (Placement(transformation(extent={{-283.572,158.886},{-214.972,227.486}})));
  equation
    connect('Revolute__7'.axis, flange_a) annotation (Line(points={{-76.96,193.36},{-251.457,193.36},{-251.457,193.186},{-249.272,193.186}}, color={0,0,0}));
  end Engine;


  model Test

    Engine engine annotation (Placement(
          transformation(extent={{-40.07,-50},{40.07,50}}, origin={49.4552,7.40656})));
    inner Modelica.Mechanics.MultiBody.World world(
      n={0,0,-1},
      animateWorld=false,
      animateGravity=false) annotation (Placement(transformation(extent={{-10,-10},
              {10,10}}, origin={51.4156,86.9274})));
    Modelica.Mechanics.MultiBody.Forces.WorldForce force annotation (Placement(
          transformation(extent={{-10,-10},{10,10}}, origin={-21.133,67.9735})));
    Modelica.Mechanics.Rotational.Sensors.AccSensor accSensor annotation (
        Placement(transformation(extent={{10,-10},{-10,10}}, origin={-25.4907,0.21711})));
    Modelica.Blocks.Math.InverseBlockConstraints inverseBlockConstraints
      annotation (Placement(transformation(extent={{-20,-12},{20,12}}, origin={-52.7233,
              32.4613})));
    Modelica.Blocks.Sources.Constant const(k=0) annotation (Placement(
          transformation(extent={{-91.918,71.699},{-71.918,91.699}})));
    Modelica.Blocks.Sources.Constant const1(k=0) annotation (Placement(
          transformation(extent={{-101.94,52.962},{-81.94,72.962}})));
    Modelica.Blocks.Sources.TimeTable timeTable(table=[0,0; 1,3; 5,6; 10,6])
      annotation (Placement(transformation(extent={{-102,20},{-82,40}})));
  equation
    connect(engine.'MainAxis_frame', world.frame_b) annotation (Line(
        points={{68.9645,57.4066},{69.2806,57.4066},{69.2806,86.9274},{61.4156,
          86.9274}},
        color={95,95,95},
        thickness=0.5));

    connect(force.frame_b, engine.'PistonForceAxis_frame') annotation (Line(
        points={{-11.133,67.9735},{22.222,67.9735},{22.222,67.973},{50.273,
          67.973},{50.273,57.4066}},
        color={95,95,95},
        thickness=0.5));
    connect(inverseBlockConstraints.y1, force.force[2]) annotation (Line(points={{
            -31.7233,32.4613},{-21.351,32.4613},{-21.351,49.237},{-20.916,49.237},
            {-20.916,50.544},{-49.02,50.544},{-49.02,64.923},{-33.133,64.923},{-33.133,
            67.9735}}, color={0,0,127}));
    connect(const.y, force.force[1]) annotation (Line(points={{-70.918,81.699},
          {-33.334,81.699},{-33.334,66.6402},{-33.133,66.6402}},
                                                          color={0,0,127}));
    connect(const1.y, force.force[3]) annotation (Line(points={{-80.94,62.962},
          {-33.133,62.962},{-33.133,69.3068}},
                                        color={0,0,127}));
    connect(inverseBlockConstraints.u1, timeTable.y) annotation (Line(
        points={{-74.7233,32.4613},{-78,32.4613},{-78,30},{-81,30}},
        color={0,0,127},
        smooth=Smooth.None));
    connect(accSensor.a, inverseBlockConstraints.u2) annotation (Line(
        points={{-36.4907,0.21711},{-36.4907,0},{-52,0},{-52,32.4613},{-68.7233,32.4613}},
        color={0,0,127},
        smooth=Smooth.None));

    connect(engine.flange_a, accSensor.flange) annotation (Line(points={{9.47025,
          -0.165169},{-15.4907,-0.165169},{-15.4907,0.21711}},
                                                      color={0,0,0}));
    annotation (
      Diagram(coordinateSystem(preserveAspectRatio=false, extent={{-100,-100},{100,
              100}}), graphics),
      __Dymola_experimentSetupOutput(
        equdistant=true,
        events=true,
        textual=false,
        doublePrecision=false),
      experiment(StopTime=5.0000000000000000, Tolerance=0.0001000000000000));
  end Test;

  annotation (uses(Modelica(version="3.2.1"), CATIAMultiBody(version="1.2"), MultiBodyCutJoints(version="1.0")));
end Engine1cyl;
