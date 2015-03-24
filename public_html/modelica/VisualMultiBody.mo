within ;
package VisualMultiBody
  package Examples
    model BlockOnPlane
      inner Modelica.Mechanics.MultiBody.World world
        annotation (Placement(transformation(extent={{-100,-10},{-80,10}})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox plane(
        length=20,
        color={175,175,175},
        specularCoefficient=0,
        width=0.1,
        height=0.5,
        r={0,0,0},
        r_shape={-10,-0.05,0},
        lengthDirection={1,0,0})
        annotation (Placement(transformation(extent={{-20,-10},{0,10}})));
      Modelica.Mechanics.MultiBody.Parts.FixedRotation fixedRotation(n={0,0,1},
          angle=-10)
        annotation (Placement(transformation(extent={{-60,-10},{-40,10}})));
      Modelica.Mechanics.MultiBody.Joints.Prismatic prismatic
        annotation (Placement(transformation(extent={{0,10},{20,30}})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox bodyBox(
        r={0,0,0},
        r_shape={0,0.25,0},
        lengthDirection={1,0,0},
        length=1,
        width=0.5,
        height=0.2,
        color={255,0,0})
        annotation (Placement(transformation(extent={{40,10},{60,30}})));
    equation
      connect(world.frame_b, fixedRotation.frame_a) annotation (Line(
          points={{-80,0},{-70,0},{-60,0}},
          color={95,95,95},
          thickness=0.5));
      connect(plane.frame_a, fixedRotation.frame_b) annotation (Line(
          points={{-20,0},{-40,0}},
          color={95,95,95},
          thickness=0.5));
      connect(plane.frame_b, prismatic.frame_a) annotation (Line(
          points={{8.88178e-016,0},{0,0},{0,20}},
          color={95,95,95},
          thickness=0.5));
      connect(prismatic.frame_b, bodyBox.frame_a) annotation (Line(
          points={{20,20},{30,20},{40,20}},
          color={95,95,95},
          thickness=0.5));
      annotation (Diagram(graphics));
    end BlockOnPlane;

    model BlockOnPlaneWithSpringDamper
      inner Modelica.Mechanics.MultiBody.World world
        annotation (Placement(transformation(extent={{-100,-10},{-80,10}})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox plane(
        length=20,
        color={175,175,175},
        specularCoefficient=0,
        width=0.1,
        height=0.5,
        r={0,0,0},
        r_shape={-10,-0.05,0},
        lengthDirection={1,0,0})
        annotation (Placement(transformation(extent={{-20,-10},{0,10}})));
      Modelica.Mechanics.MultiBody.Parts.FixedRotation fixedRotation(n={0,0,1},
          angle=-10)
        annotation (Placement(transformation(extent={{-60,-10},{-40,10}})));
      Modelica.Mechanics.MultiBody.Joints.Prismatic prismatic(useAxisFlange=
            true)
        annotation (Placement(transformation(extent={{0,10},{20,30}})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox bodyBox(
        r={0,0,0},
        r_shape={0,0.25,0},
        lengthDirection={1,0,0},
        length=1,
        width=0.5,
        height=0.2,
        color={255,0,0})
        annotation (Placement(transformation(extent={{40,10},{60,30}})));
      Modelica.Mechanics.Translational.Components.SpringDamper springDamper(c=
            1000, d=2001)
        annotation (Placement(transformation(extent={{0,40},{20,60}})));
    equation
      connect(world.frame_b, fixedRotation.frame_a) annotation (Line(
          points={{-80,0},{-70,0},{-60,0}},
          color={95,95,95},
          thickness=0.5));
      connect(plane.frame_a, fixedRotation.frame_b) annotation (Line(
          points={{-20,0},{-40,0}},
          color={95,95,95},
          thickness=0.5));
      connect(plane.frame_b, prismatic.frame_a) annotation (Line(
          points={{8.88178e-016,0},{0,0},{0,20}},
          color={95,95,95},
          thickness=0.5));
      connect(prismatic.frame_b, bodyBox.frame_a) annotation (Line(
          points={{20,20},{30,20},{40,20}},
          color={95,95,95},
          thickness=0.5));
      connect(springDamper.flange_a, prismatic.support) annotation (Line(points
            ={{0,50},{0,50},{0,34},{2,34},{4,34},{4,26},{6,26}}, color={0,127,0}));
      connect(springDamper.flange_b, prismatic.axis) annotation (Line(points={{
              20,50},{20,34},{18,34},{18,26}}, color={0,127,0}));
      annotation (Diagram(coordinateSystem(preserveAspectRatio=false, extent={{
                -100,-100},{100,100}}),
                          graphics));
    end BlockOnPlaneWithSpringDamper;

    model SwingRide
      inner Modelica.Mechanics.MultiBody.World world
        annotation (Placement(transformation(extent={{-100,20},{-80,40}})));
      Modelica.Mechanics.MultiBody.Joints.Revolute revolute(
        n={0,1,0},
        phi(fixed=true),
        useAxisFlange=true,
        w(
          fixed=true,
          displayUnit="deg/s",
          start=1.5707963267949))
        annotation (Placement(transformation(extent={{-60,20},{-40,40}})));
      Modelica.Mechanics.MultiBody.Joints.Revolute revolute1(n={1,0,0})
        annotation (Placement(transformation(extent={{20,20},{40,40}})));
      Modelica.Mechanics.MultiBody.Joints.Revolute revolute2
        annotation (Placement(transformation(extent={{60,20},{80,40}})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox bodyBox(r={5,0,0}, color={175,
            175,175})
        annotation (Placement(transformation(extent={{-20,20},{0,40}})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox bodyBox1(r={0,-5,0}, color={
            175,175,175}) annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=-90,
            origin={90,10})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox bodyBox2(
        r={0,-0.5,0},
        width=0.5,
        height=0.5,
        color={255,0,0}) annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=-90,
            origin={90,-30})));
      Modelica.Mechanics.Rotational.Sources.ConstantSpeed constantSpeed(w_fixed(
            displayUnit="deg/s") = 1.5707963267949)
        annotation (Placement(transformation(extent={{-80,60},{-60,80}})));
    equation
      connect(world.frame_b, revolute.frame_a) annotation (Line(
          points={{-80,30},{-70,30},{-60,30}},
          color={95,95,95},
          thickness=0.5));
      connect(revolute1.frame_b, revolute2.frame_a) annotation (Line(
          points={{40,30},{60,30}},
          color={95,95,95},
          thickness=0.5));
      connect(revolute.frame_b, bodyBox.frame_a) annotation (Line(
          points={{-40,30},{-20,30}},
          color={95,95,95},
          thickness=0.5));
      connect(bodyBox.frame_b, revolute1.frame_a) annotation (Line(
          points={{0,30},{20,30}},
          color={95,95,95},
          thickness=0.5));
      connect(revolute2.frame_b, bodyBox1.frame_a) annotation (Line(
          points={{80,30},{90,30},{90,20}},
          color={95,95,95},
          thickness=0.5));
      connect(bodyBox1.frame_b, bodyBox2.frame_a) annotation (Line(
          points={{90,0},{90,0},{90,-20}},
          color={95,95,95},
          thickness=0.5));
      connect(constantSpeed.flange, revolute.axis) annotation (Line(points={{
              -60,70},{-56,70},{-50,70},{-50,40}}, color={0,0,0}));
      annotation (Diagram(coordinateSystem(preserveAspectRatio=false, extent={{
                -100,-100},{100,100}}), graphics));
    end SwingRide;

    model Engine "Model of one cylinder engine"
      extends Modelica.Icons.Example;
      Modelica.Mechanics.MultiBody.Parts.BodyCylinder Piston(diameter=0.1, r={0,-0.1,
            0}) annotation (Placement(transformation(
            origin={90.5,66.5},
            extent={{-10.5,30.5},{10.5,-30.5}},
            rotation=270)));
      Modelica.Mechanics.MultiBody.Parts.BodyBox Rod(
        widthDirection={1,0,0},
        width=0.02,
        height=0.06,
        r={0,-0.2,0},
        color={0,0,200}) annotation (Placement(transformation(
            origin={90,5},
            extent={{10,-10},{-10,10}},
            rotation=90)));
      Modelica.Mechanics.MultiBody.Joints.Revolute B2(
        n={1,0,0},
        cylinderLength=0.02,
        cylinderDiameter=0.05,
        phi(fixed=true),
        w(fixed=true))         annotation (Placement(transformation(extent={{80,22},
                {100,42}}, rotation=0)));
      Modelica.Mechanics.MultiBody.Joints.Revolute Bearing(
        useAxisFlange=true,
        n={1,0,0},
        cylinderLength=0.02,
        cylinderDiameter=0.05) annotation (Placement(transformation(extent={{-10,-80},
                {10,-100}}, rotation=0)));
      inner Modelica.Mechanics.MultiBody.World world annotation (Placement(
            transformation(extent={{-50,-100},{-30,-80}}, rotation=0)));
      Modelica.Mechanics.Rotational.Components.Inertia Inertia(
        stateSelect=StateSelect.always,
        phi(fixed=true, start=0),
        w(fixed=true, start=10),
        J=1) annotation (Placement(transformation(extent={{-28,-120},{-8,-100}},
              rotation=0)));
      Modelica.Mechanics.MultiBody.Parts.BodyBox Crank4(
        height=0.05,
        widthDirection={1,0,0},
        width=0.02,
        r={0,-0.1,0}) annotation (Placement(transformation(
            origin={115.5,-75},
            extent={{10,-10},{-10,10}},
            rotation=90)));
      Modelica.Mechanics.MultiBody.Parts.BodyCylinder Crank3(r={0.1,0,0}, diameter=
            0.03) annotation (Placement(transformation(extent={{81.5,-71},{101.5,-51}},
              rotation=0)));
      Modelica.Mechanics.MultiBody.Parts.BodyCylinder Crank1(diameter=0.05, r={0.1,
            0,0}) annotation (Placement(transformation(extent={{24,-100},{44,-80}},
              rotation=0)));
      Modelica.Mechanics.MultiBody.Parts.BodyBox Crank2(
        r={0,0.1,0},
        height=0.05,
        widthDirection={1,0,0},
        width=0.02) annotation (Placement(transformation(
            origin={70,-76},
            extent={{-10,-10},{10,10}},
            rotation=90)));
      Modelica.Mechanics.MultiBody.Joints.Revolute B1(
        n={1,0,0},
        cylinderLength=0.02,
        cylinderDiameter=0.05) annotation (Placement(transformation(extent={{80,-30},
                {100,-10}}, rotation=0)));
      Modelica.Mechanics.MultiBody.Parts.FixedTranslation Mid(r={0.05,0,0})
        annotation (Placement(transformation(extent={{70,-53},{90,-33}}, rotation=0)));
      Modelica.Mechanics.MultiBody.Joints.Prismatic Cylinder(
        boxWidth=0.02,
        n={0,-1,0},
        s(start=0.05, fixed=true),
        v(fixed=true)) annotation (Placement(transformation(
            origin={90,96},
            extent={{-10,-10},{10,10}},
            rotation=270)));
      Modelica.Mechanics.MultiBody.Parts.FixedTranslation cylPosition(animation=
            false, r={0.15,0.45,0}) annotation (Placement(transformation(extent={{-0.5,
                100},{19.5,120}}, rotation=0)));
      Joints.Bushing bushing
        annotation (Placement(transformation(extent={{112,-30},{132,-10}})));
    equation
      connect(world.frame_b, Bearing.frame_a) annotation (Line(
          points={{-30,-90},{-10,-90}},
          color={95,95,95},
          thickness=0.5));
      connect(Crank2.frame_a, Crank1.frame_b) annotation (Line(
          points={{70,-86},{70,-90},{44,-90}},
          color={95,95,95},
          thickness=0.5));
      connect(Crank2.frame_b, Crank3.frame_a) annotation (Line(
          points={{70,-66},{70,-61},{81.5,-61}},
          color={95,95,95},
          thickness=0.5));
      connect(Bearing.frame_b, Crank1.frame_a) annotation (Line(
          points={{10,-90},{24,-90}},
          color={95,95,95},
          thickness=0.5));
      connect(cylPosition.frame_b, Cylinder.frame_a) annotation (Line(
          points={{19.5,110},{90,110},{90,106}},
          color={95,95,95},
          thickness=0.5));
      connect(world.frame_b, cylPosition.frame_a) annotation (Line(
          points={{-30,-90},{-20,-90},{-20,110},{-0.5,110}},
          color={95,95,95},
          thickness=0.5));
      connect(Crank3.frame_b, Crank4.frame_a) annotation (Line(
          points={{101.5,-61},{115,-61},{115,-65},{115.5,-65}},
          color={95,95,95},
          thickness=0.5));
      connect(B1.frame_a, Mid.frame_b) annotation (Line(
          points={{80,-20},{70,-20},{70,-32},{98,-32},{98,-43},{90,-43}},
          color={95,95,95},
          thickness=0.5));
      connect(Rod.frame_a, B2.frame_b) annotation (Line(
          points={{90,15},{90,21},{110,21},{110,32},{100,32}},
          color={95,95,95},
          thickness=0.5));
      connect(B2.frame_a, Piston.frame_b) annotation (Line(
          points={{80,32},{70,32},{70,46},{90.5,46},{90.5,56}},
          color={95,95,95},
          thickness=0.5));
      connect(Inertia.flange_b, Bearing.axis)
        annotation (Line(points={{-8,-110},{0,-110},{0,-100}}, color={0,0,0}));
      connect(Mid.frame_a, Crank2.frame_b) annotation (Line(
          points={{70,-43},{63,-43},{63,-61},{70,-61},{70,-66}},
          color={95,95,95},
          thickness=0.5));
      connect(Cylinder.frame_b, Piston.frame_a) annotation (Line(
          points={{90,86},{90,77},{90.5,77}},
          color={95,95,95},
          thickness=0.5));
      connect(B1.frame_b, bushing.frame_a) annotation (Line(
          points={{100,-20},{106,-20},{112,-20}},
          color={95,95,95},
          thickness=0.5));
      connect(bushing.frame_b, Rod.frame_b) annotation (Line(
          points={{132,-20},{140,-20},{140,-8},{90,-8},{90,-5}},
          color={95,95,95},
          thickness=0.5));
      annotation (Diagram(coordinateSystem(extent={{-130,-130},{130,130}},
              preserveAspectRatio=false), graphics),
        experiment(StopTime=5), Documentation(info="<html>
<p>
This is a model of the mechanical part of one cylinder of an engine.
The combustion is not modelled. The \"inertia\" component at the lower
left part is the output inertia of the engine driving the gearbox.
The angular velocity of the output inertia has a start value of 10 rad/s
in order to demonstrate the movement of the engine.
</p>
<p>
The engine is modeled solely by revolute and prismatic joints.
Since this results in a <b>planar</b> loop there is the well known
difficulty that the cut-forces perpendicular to the loop cannot be
uniquely computed, as well as the cut-torques within the plane.
This ambiguity is resolved by using the option <b>planarCutJoint</b>
in the <b>Advanced</b> menu of one revolute joint in every planar loop
(here: joint B1). This option sets the cut-force in direction of the
axis of rotation, as well as the cut-torques perpendicular to the axis
of rotation at this joint to zero and makes the problem mathematically
well-formed.
</p>
<p>
An animation of this example is shown in the figure below.
</p>

<IMG src=\"modelica://Modelica/Resources/Images/Mechanics/MultiBody/Examples/Loops/Engine.png\" ALT=\"model Examples.Loops.Engine\">
</html>"));
    end Engine;

    model WheelOnPlane
      Joints.RollingWheel rollingWheel(radius=1, revolute(phi(fixed=true), w(
              fixed=true, start=1)))
        annotation (Placement(transformation(extent={{20,-10},{40,10}})));
      inner Modelica.Mechanics.MultiBody.World world
        annotation (Placement(transformation(extent={{-100,-10},{-80,10}})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox plane(
        length=20,
        color={175,175,175},
        specularCoefficient=0,
        width=0.1,
        height=0.5,
        r={0,0,0},
        r_shape={-10,-0.05,0},
        lengthDirection={1,0,0})
        annotation (Placement(transformation(extent={{-20,-10},{0,10}})));
      Modelica.Mechanics.MultiBody.Parts.BodyCylinder wheel(
        r={0,0,0},
        lengthDirection={0,0,1},
        length=0.1,
        diameter=2,
        color={95,95,95},
        specularCoefficient=0)
        annotation (Placement(transformation(extent={{40,30},{60,50}})));
      Modelica.Mechanics.MultiBody.Parts.FixedRotation fixedRotation(n={0,0,1},
          angle=-10)
        annotation (Placement(transformation(extent={{-60,-10},{-40,10}})));
    equation
      connect(plane.frame_b, rollingWheel.frame_a) annotation (Line(
          points={{0,0},{10,0},{20,0}},
          color={95,95,95},
          thickness=0.5));
      connect(rollingWheel.frame_b, wheel.frame_a) annotation (Line(
          points={{30,6},{30,24},{30,40},{40,40}},
          color={95,95,95},
          thickness=0.5));
      connect(world.frame_b, fixedRotation.frame_a) annotation (Line(
          points={{-80,0},{-70,0},{-60,0}},
          color={95,95,95},
          thickness=0.5));
      connect(plane.frame_a, fixedRotation.frame_b) annotation (Line(
          points={{-20,0},{-40,0}},
          color={95,95,95},
          thickness=0.5));
      annotation (Diagram(graphics));
    end WheelOnPlane;

    model ParallelogramLinkage "Meriam-Kraige - Example 6.32"

      inner Modelica.Mechanics.MultiBody.World world
        annotation (Placement(transformation(extent={{-100,-100},{-80,-80}})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox foundation(
        color={175,175,175},
        specularCoefficient=0,
        r={1,0,0})
        annotation (Placement(transformation(extent={{-10,-60},{10,-40}})));
      Modelica.Mechanics.MultiBody.Joints.RevolutePlanarLoopConstraint D
        annotation (Placement(transformation(extent={{20,-60},{40,-40}})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox link2(
        color={175,175,175},
        specularCoefficient=0,
        r={1,0,0}) annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=90,
            origin={50,-10})));
      Modelica.Mechanics.MultiBody.Parts.BodyShape platform(
        color={175,175,175},
        specularCoefficient=0,
        r={1,0,0},
        m=200,
        r_CM={0.5,0,0}) annotation (Placement(transformation(
            extent={{10,-10},{-10,10}},
            rotation=0,
            origin={0,20})));
      Modelica.Mechanics.MultiBody.Joints.Revolute B(phi(fixed=false, start=
              1.5707963267949), w(fixed=false))
                                annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=180,
            origin={30,20})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox link1(
        color={175,175,175},
        specularCoefficient=0,
        r={1,0,0}) annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=270,
            origin={-52,-10})));
      Modelica.Mechanics.MultiBody.Joints.Revolute A(phi(fixed=false, start=
              1.5707963267949)) annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=180,
            origin={-30,20})));
      Modelica.Mechanics.MultiBody.Joints.Revolute C(
        useAxisFlange=true,
        w(fixed=true),
        phi(fixed=true, start=1.5707963267949))
        annotation (Placement(transformation(extent={{-40,-60},{-20,-40}})));
      Modelica.Mechanics.Rotational.Sources.ConstantTorque constantTorque(
          tau_constant=3000)
        annotation (Placement(transformation(extent={{-100,-40},{-80,-20}})));
    equation
      connect(world.frame_b, foundation.frame_a) annotation (Line(
          points={{-80,-90},{-80,-90},{-14,-90},{-14,-50},{-10,-50}},
          color={95,95,95},
          thickness=0.5));
      connect(foundation.frame_b, D.frame_a) annotation (Line(
          points={{10,-50},{20,-50}},
          color={95,95,95},
          thickness=0.5));
      connect(D.frame_b, link2.frame_a) annotation (Line(
          points={{40,-50},{50,-50},{50,-20}},
          color={95,95,95},
          thickness=0.5));
      connect(link2.frame_b, B.frame_a) annotation (Line(
          points={{50,0},{50,20},{40,20}},
          color={95,95,95},
          thickness=0.5));
      connect(B.frame_b, platform.frame_a) annotation (Line(
          points={{20,20},{10,20}},
          color={95,95,95},
          thickness=0.5));
      connect(platform.frame_b, A.frame_a) annotation (Line(
          points={{-10,20},{-20,20}},
          color={95,95,95},
          thickness=0.5));
      connect(link1.frame_a, A.frame_b) annotation (Line(
          points={{-52,0},{-52,0},{-52,20},{-40,20}},
          color={95,95,95},
          thickness=0.5));
      connect(foundation.frame_a, C.frame_b) annotation (Line(
          points={{-10,-50},{-16,-50},{-20,-50}},
          color={95,95,95},
          thickness=0.5));
      connect(C.frame_a, link1.frame_b) annotation (Line(
          points={{-40,-50},{-46,-50},{-52,-50},{-52,-20}},
          color={95,95,95},
          thickness=0.5));
      connect(C.axis, constantTorque.flange) annotation (Line(points={{-30,-40},
              {-30,-40},{-30,-30},{-56,-30},{-80,-30}}, color={0,0,0}));
      annotation (Diagram(coordinateSystem(preserveAspectRatio=false, extent={{-100,
                -100},{100,100}}),
                          graphics));
    end ParallelogramLinkage;

    model ParallelogramLinkageStiff "Meriam-Kraige - Example 6.32"

      inner Modelica.Mechanics.MultiBody.World world
        annotation (Placement(transformation(extent={{-100,-100},{-80,-80}})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox foundation(
        color={175,175,175},
        specularCoefficient=0,
        r={1,0,0})
        annotation (Placement(transformation(extent={{-10,-60},{10,-40}})));
      Modelica.Mechanics.MultiBody.Joints.Revolute                     D
        annotation (Placement(transformation(extent={{20,-60},{40,-40}})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox link2(
        color={175,175,175},
        specularCoefficient=0,
        r={1,0,0}) annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=90,
            origin={50,-10})));
      Modelica.Mechanics.MultiBody.Parts.BodyShape platform(
        color={175,175,175},
        specularCoefficient=0,
        r={1,0,0},
        m=200,
        r_CM={0.5,0,0}) annotation (Placement(transformation(
            extent={{10,-10},{-10,10}},
            rotation=0,
            origin={0,20})));
      Modelica.Mechanics.MultiBody.Joints.Revolute B(phi(fixed=false, start=
              1.5707963267949)) annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=180,
            origin={30,20})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox link1(
        color={175,175,175},
        specularCoefficient=0,
        r={1,0,0}) annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=270,
            origin={-52,-10})));
      Modelica.Mechanics.MultiBody.Joints.Revolute A(phi(fixed=false, start=
              1.5707963267949)) annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=180,
            origin={-30,20})));
      Modelica.Mechanics.MultiBody.Joints.Revolute C(
        useAxisFlange=true,
        phi(fixed=true, start=0.017453292519943),
        w(fixed=true))
        annotation (Placement(transformation(extent={{-40,-60},{-20,-40}})));
      Modelica.Mechanics.Rotational.Sources.ConstantTorque constantTorque(
          tau_constant=3000)
        annotation (Placement(transformation(extent={{-100,-40},{-80,-20}})));
      Joints.StiffJoint stiffJoint annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=90,
            origin={50,-34})));
    equation
      connect(world.frame_b, foundation.frame_a) annotation (Line(
          points={{-80,-90},{-80,-90},{-14,-90},{-14,-50},{-10,-50}},
          color={95,95,95},
          thickness=0.5));
      connect(foundation.frame_b, D.frame_a) annotation (Line(
          points={{10,-50},{20,-50}},
          color={95,95,95},
          thickness=0.5));
      connect(link2.frame_b, B.frame_a) annotation (Line(
          points={{50,0},{50,20},{40,20}},
          color={95,95,95},
          thickness=0.5));
      connect(B.frame_b, platform.frame_a) annotation (Line(
          points={{20,20},{14,20},{10,20}},
          color={95,95,95},
          thickness=0.5));
      connect(platform.frame_b, A.frame_a) annotation (Line(
          points={{-10,20},{-20,20}},
          color={95,95,95},
          thickness=0.5));
      connect(link1.frame_a, A.frame_b) annotation (Line(
          points={{-52,0},{-52,0},{-52,20},{-40,20}},
          color={95,95,95},
          thickness=0.5));
      connect(foundation.frame_a, C.frame_b) annotation (Line(
          points={{-10,-50},{-16,-50},{-20,-50}},
          color={95,95,95},
          thickness=0.5));
      connect(C.frame_a, link1.frame_b) annotation (Line(
          points={{-40,-50},{-46,-50},{-52,-50},{-52,-20}},
          color={95,95,95},
          thickness=0.5));
      connect(C.axis, constantTorque.flange) annotation (Line(points={{-30,-40},
              {-30,-40},{-30,-30},{-56,-30},{-80,-30}}, color={0,0,0}));
      connect(D.frame_b, stiffJoint.frame_a) annotation (Line(
          points={{40,-50},{50,-50},{50,-44}},
          color={95,95,95},
          thickness=0.5));
      connect(stiffJoint.frame_b, link2.frame_a) annotation (Line(
          points={{50,-24},{50,-20}},
          color={95,95,95},
          thickness=0.5));
      annotation (Diagram(coordinateSystem(preserveAspectRatio=false, extent={{
                -100,-100},{100,100}}),
                          graphics));
    end ParallelogramLinkageStiff;

    model ParallelogramLinkageBushing "Meriam-Kraige - Example 6.32"

      inner Modelica.Mechanics.MultiBody.World world
        annotation (Placement(transformation(extent={{-100,-100},{-80,-80}})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox foundation(
        color={175,175,175},
        specularCoefficient=0,
        r={1,0,0})
        annotation (Placement(transformation(extent={{-10,-60},{10,-40}})));
      Modelica.Mechanics.MultiBody.Joints.Revolute                     D(w(fixed=
              true), phi(fixed=false, start=1.3962634015955))
        annotation (Placement(transformation(extent={{20,-60},{40,-40}})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox link2(
        color={175,175,175},
        specularCoefficient=0,
        r={1,0,0}) annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=90,
            origin={50,-10})));
      Modelica.Mechanics.MultiBody.Parts.BodyShape platform(
        color={175,175,175},
        specularCoefficient=0,
        r={1,0,0},
        m=200,
        r_CM={0.5,0,0},
        shapeType="box")
                        annotation (Placement(transformation(
            extent={{10,-10},{-10,10}},
            rotation=0,
            origin={0,20})));
      Modelica.Mechanics.MultiBody.Joints.Revolute B(w(fixed=true), phi(fixed=
              true, start=1.5707963267949))
                                annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=180,
            origin={30,20})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox link1(
        color={175,175,175},
        specularCoefficient=0,
        r={1,0,0}) annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=270,
            origin={-52,-10})));
      Modelica.Mechanics.MultiBody.Joints.Revolute A(w(fixed=true), phi(fixed=
              true, start=1.5707963267949))
                                annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=180,
            origin={-30,20})));
      Modelica.Mechanics.MultiBody.Joints.Revolute C(
        useAxisFlange=true,
        w(fixed=true),
        phi(fixed=true, start=1.5707963267949))
        annotation (Placement(transformation(extent={{-40,-60},{-20,-40}})));
      Modelica.Mechanics.Rotational.Sources.ConstantTorque constantTorque(
          tau_constant=3000)
        annotation (Placement(transformation(extent={{-100,-40},{-80,-20}})));
      TestBushing.Bushing
                        stiffJoint annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=90,
            origin={50,-34})));
    equation
      connect(world.frame_b, foundation.frame_a) annotation (Line(
          points={{-80,-90},{-80,-90},{-14,-90},{-14,-50},{-10,-50}},
          color={95,95,95},
          thickness=0.5));
      connect(foundation.frame_b, D.frame_a) annotation (Line(
          points={{10,-50},{20,-50}},
          color={95,95,95},
          thickness=0.5));
      connect(link2.frame_b, B.frame_a) annotation (Line(
          points={{50,0},{50,20},{40,20}},
          color={95,95,95},
          thickness=0.5));
      connect(B.frame_b, platform.frame_a) annotation (Line(
          points={{20,20},{10,20}},
          color={95,95,95},
          thickness=0.5));
      connect(platform.frame_b, A.frame_a) annotation (Line(
          points={{-10,20},{-20,20}},
          color={95,95,95},
          thickness=0.5));
      connect(link1.frame_a, A.frame_b) annotation (Line(
          points={{-52,0},{-52,0},{-52,20},{-40,20}},
          color={95,95,95},
          thickness=0.5));
      connect(foundation.frame_a, C.frame_b) annotation (Line(
          points={{-10,-50},{-16,-50},{-20,-50}},
          color={95,95,95},
          thickness=0.5));
      connect(C.frame_a, link1.frame_b) annotation (Line(
          points={{-40,-50},{-46,-50},{-52,-50},{-52,-20}},
          color={95,95,95},
          thickness=0.5));
      connect(C.axis, constantTorque.flange) annotation (Line(points={{-30,-40},
              {-30,-40},{-30,-30},{-56,-30},{-80,-30}}, color={0,0,0}));
      connect(D.frame_b, stiffJoint.frame_a) annotation (Line(
          points={{40,-50},{50,-50},{50,-44}},
          color={95,95,95},
          thickness=0.5));
      connect(stiffJoint.frame_b, link2.frame_a) annotation (Line(
          points={{50,-24},{50,-20}},
          color={95,95,95},
          thickness=0.5));
      annotation (Diagram(coordinateSystem(preserveAspectRatio=false, extent={{-100,
                -100},{100,100}}),
                          graphics));
    end ParallelogramLinkageBushing;

    model ParallelogramLinkageBushing2 "Meriam-Kraige - Example 6.32"

      inner Modelica.Mechanics.MultiBody.World world
        annotation (Placement(transformation(extent={{-100,-100},{-80,-80}})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox foundation(
        color={175,175,175},
        specularCoefficient=0,
        r={1,0,0})
        annotation (Placement(transformation(extent={{-10,-60},{10,-40}})));
      Modelica.Mechanics.MultiBody.Joints.Revolute                     D(phi(fixed
            =true, start=1.5707963267949), w(fixed=true))
        annotation (Placement(transformation(extent={{20,-60},{40,-40}})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox link2(
        color={175,175,175},
        specularCoefficient=0,
        r={0.5,0,0})
                   annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=90,
            origin={50,0})));
      Modelica.Mechanics.MultiBody.Parts.BodyShape platform(
        color={175,175,175},
        specularCoefficient=0,
        r={1,0,0},
        m=200,
        r_CM={0.5,0,0}) annotation (Placement(transformation(
            extent={{10,-10},{-10,10}},
            rotation=0,
            origin={0,20})));
      Modelica.Mechanics.MultiBody.Joints.Revolute B(w(fixed=true), phi(fixed=
              true, start=1.5707963267949))
                                annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=180,
            origin={30,20})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox link1(
        color={175,175,175},
        specularCoefficient=0,
        r={1,0,0}) annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=270,
            origin={-52,-10})));
      Modelica.Mechanics.MultiBody.Joints.Revolute A(w(fixed=true), phi(fixed=
              true, start=1.5707963267949))
                                annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=180,
            origin={-30,20})));
      Modelica.Mechanics.MultiBody.Joints.Revolute C(
        useAxisFlange=true,
        w(fixed=true),
        phi(fixed=true, start=1.5707963267949))
        annotation (Placement(transformation(extent={{-40,-60},{-20,-40}})));
      Modelica.Mechanics.Rotational.Sources.ConstantTorque constantTorque(
          tau_constant=3000)
        annotation (Placement(transformation(extent={{-100,-40},{-80,-20}})));
      TestBushing.Bushing
                        stiffJoint(
        c_x=1e9,
        c_y=1e9,
        c_z=1e9,
        d_x=1e6,
        d_y=1e6,
        d_z=1e6,
        c_al=1e7,
        c_be=1e7,
        c_ga=1e7,
        d_al=1e4,
        d_be=1e4,
        d_ga=1e4)                  annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=90,
            origin={50,-26})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox link2B(
        color={175,175,175},
        specularCoefficient=0,
        r={0.5,0,0}) annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=90,
            origin={60,-50})));
    equation
      connect(world.frame_b, foundation.frame_a) annotation (Line(
          points={{-80,-90},{-80,-90},{-14,-90},{-14,-50},{-10,-50}},
          color={95,95,95},
          thickness=0.5));
      connect(foundation.frame_b, D.frame_a) annotation (Line(
          points={{10,-50},{10,-50},{20,-50}},
          color={95,95,95},
          thickness=0.5));
      connect(link2.frame_b, B.frame_a) annotation (Line(
          points={{50,10},{50,20},{40,20}},
          color={95,95,95},
          thickness=0.5));
      connect(B.frame_b, platform.frame_a) annotation (Line(
          points={{20,20},{14,20},{10,20}},
          color={95,95,95},
          thickness=0.5));
      connect(platform.frame_b, A.frame_a) annotation (Line(
          points={{-10,20},{-20,20}},
          color={95,95,95},
          thickness=0.5));
      connect(link1.frame_a, A.frame_b) annotation (Line(
          points={{-52,0},{-52,0},{-52,20},{-40,20}},
          color={95,95,95},
          thickness=0.5));
      connect(foundation.frame_a, C.frame_b) annotation (Line(
          points={{-10,-50},{-16,-50},{-20,-50}},
          color={95,95,95},
          thickness=0.5));
      connect(C.frame_a, link1.frame_b) annotation (Line(
          points={{-40,-50},{-46,-50},{-52,-50},{-52,-20}},
          color={95,95,95},
          thickness=0.5));
      connect(C.axis, constantTorque.flange) annotation (Line(points={{-30,-40},
              {-30,-40},{-30,-30},{-56,-30},{-80,-30}}, color={0,0,0}));
      connect(stiffJoint.frame_b, link2.frame_a) annotation (Line(
          points={{50,-16},{50,-14},{50,-10}},
          color={95,95,95},
          thickness=0.5));
      connect(stiffJoint.frame_a, link2B.frame_b) annotation (Line(
          points={{50,-36},{60,-36},{60,-40}},
          color={95,95,95},
          thickness=0.5));
      connect(D.frame_b, link2B.frame_a) annotation (Line(
          points={{40,-50},{46,-50},{46,-60},{60,-60}},
          color={95,95,95},
          thickness=0.5));
      annotation (Diagram(coordinateSystem(preserveAspectRatio=false, extent={{-100,
                -100},{100,100}}),
                          graphics));
    end ParallelogramLinkageBushing2;

    model ParallelogramLinkageCut "Meriam-Kraige - Example 6.32"

      inner Modelica.Mechanics.MultiBody.World world
        annotation (Placement(transformation(extent={{-100,-100},{-80,-80}})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox foundation(
        color={175,175,175},
        specularCoefficient=0,
        r={1,0,0})
        annotation (Placement(transformation(extent={{-10,-60},{10,-40}})));
      Modelica.Mechanics.MultiBody.Joints.Revolute                     D(w(fixed=
              true), phi(fixed=false, start=1.3962634015955))
        annotation (Placement(transformation(extent={{20,-60},{40,-40}})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox link2(
        color={175,175,175},
        specularCoefficient=0,
        r={1,0,0}) annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=90,
            origin={50,-10})));
      Modelica.Mechanics.MultiBody.Parts.BodyShape platform(
        color={175,175,175},
        specularCoefficient=0,
        r={1,0,0},
        m=200,
        r_CM={0.5,0,0}) annotation (Placement(transformation(
            extent={{10,-10},{-10,10}},
            rotation=0,
            origin={0,20})));
      Modelica.Mechanics.MultiBody.Joints.Revolute B(w(fixed=true), phi(fixed=
              true, start=1.5707963267949))
                                annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=180,
            origin={30,20})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox link1(
        color={175,175,175},
        specularCoefficient=0,
        r={1,0,0}) annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=270,
            origin={-52,-10})));
      Modelica.Mechanics.MultiBody.Joints.Revolute A(w(fixed=true), phi(fixed=
              true, start=1.5707963267949))
                                annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=180,
            origin={-30,20})));
      Modelica.Mechanics.MultiBody.Joints.Revolute C(
        useAxisFlange=true,
        w(fixed=true),
        phi(fixed=true, start=1.5707963267949))
        annotation (Placement(transformation(extent={{-40,-60},{-20,-40}})));
      Modelica.Mechanics.Rotational.Sources.ConstantTorque constantTorque(
          tau_constant=3000)
        annotation (Placement(transformation(extent={{-100,-40},{-80,-20}})));
      MultiBodyCutJoints.CutJoint
                        stiffJoint annotation (Placement(transformation(
            extent={{-10,-10},{10,10}},
            rotation=90,
            origin={50,-34})));
    equation
      connect(world.frame_b, foundation.frame_a) annotation (Line(
          points={{-80,-90},{-80,-90},{-14,-90},{-14,-50},{-10,-50}},
          color={95,95,95},
          thickness=0.5));
      connect(foundation.frame_b, D.frame_a) annotation (Line(
          points={{10,-50},{20,-50}},
          color={95,95,95},
          thickness=0.5));
      connect(link2.frame_b, B.frame_a) annotation (Line(
          points={{50,0},{50,20},{40,20}},
          color={95,95,95},
          thickness=0.5));
      connect(B.frame_b, platform.frame_a) annotation (Line(
          points={{20,20},{10,20}},
          color={95,95,95},
          thickness=0.5));
      connect(platform.frame_b, A.frame_a) annotation (Line(
          points={{-10,20},{-20,20}},
          color={95,95,95},
          thickness=0.5));
      connect(link1.frame_a, A.frame_b) annotation (Line(
          points={{-52,0},{-52,0},{-52,20},{-40,20}},
          color={95,95,95},
          thickness=0.5));
      connect(foundation.frame_a, C.frame_b) annotation (Line(
          points={{-10,-50},{-16,-50},{-20,-50}},
          color={95,95,95},
          thickness=0.5));
      connect(C.frame_a, link1.frame_b) annotation (Line(
          points={{-40,-50},{-46,-50},{-52,-50},{-52,-20}},
          color={95,95,95},
          thickness=0.5));
      connect(C.axis, constantTorque.flange) annotation (Line(points={{-30,-40},
              {-30,-40},{-30,-30},{-56,-30},{-80,-30}}, color={0,0,0}));
      connect(D.frame_b, stiffJoint.frame_a) annotation (Line(
          points={{40,-50},{50,-50},{50,-44}},
          color={95,95,95},
          thickness=0.5));
      connect(stiffJoint.frame_b, link2.frame_a) annotation (Line(
          points={{50,-24},{50,-20}},
          color={95,95,95},
          thickness=0.5));
      annotation (Diagram(coordinateSystem(preserveAspectRatio=false, extent={{-100,
                -100},{100,100}}),
                          graphics));
    end ParallelogramLinkageCut;

    model NewtonCradle
      inner Modelica.Mechanics.MultiBody.World world
        annotation (Placement(transformation(extent={{-100,40},{-80,60}})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox bodyBox(r={1,0,0}, color={255,
            85,85})
        annotation (Placement(transformation(extent={{-40,40},{-20,60}})));
      Modelica.Mechanics.MultiBody.Joints.Revolute revolute(phi(fixed=true,
            start=-3.1415926535898), w(fixed=true))
        annotation (Placement(transformation(extent={{-70,40},{-50,60}})));
      Modelica.Mechanics.MultiBody.Parts.FixedTranslation fixedTranslation(r={
            0.2,0,0})
        annotation (Placement(transformation(extent={{-68,70},{-48,90}})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox bodyBox1(r={1,0,0})
        annotation (Placement(transformation(extent={{-10,70},{10,90}})));
      Modelica.Mechanics.MultiBody.Joints.Revolute revolute1(phi(fixed=true,
            start=-1.5707963267949), w(fixed=true))
        annotation (Placement(transformation(extent={{-40,70},{-20,90}})));
      Modelica.Mechanics.MultiBody.Forces.LineForceWithMass lineForceWithMass
        annotation (Placement(transformation(extent={{20,40},{40,60}})));
      Modelica.Mechanics.Translational.Components.ElastoGap elastoGap(
        d=0,
        s_rel0=0.2,
        c=1E9) annotation (Placement(transformation(extent={{20,0},{40,20}})));
    equation
      connect(world.frame_b, revolute.frame_a) annotation (Line(
          points={{-80,50},{-70,50}},
          color={95,95,95},
          thickness=0.5));
      connect(bodyBox.frame_a, revolute.frame_b) annotation (Line(
          points={{-40,50},{-50,50}},
          color={95,95,95},
          thickness=0.5));
      connect(world.frame_b, fixedTranslation.frame_a) annotation (Line(
          points={{-80,50},{-74,50},{-74,80},{-68,80}},
          color={95,95,95},
          thickness=0.5));
      connect(bodyBox1.frame_a, revolute1.frame_b) annotation (Line(
          points={{-10,80},{-20,80}},
          color={95,95,95},
          thickness=0.5));
      connect(fixedTranslation.frame_b, revolute1.frame_a) annotation (Line(
          points={{-48,80},{-44,80},{-40,80}},
          color={95,95,95},
          thickness=0.5));
      connect(bodyBox.frame_b, lineForceWithMass.frame_a) annotation (Line(
          points={{-20,50},{20,50}},
          color={95,95,95},
          thickness=0.5));
      connect(bodyBox1.frame_b, lineForceWithMass.frame_b) annotation (Line(
          points={{10,80},{26,80},{40,80},{40,50}},
          color={95,95,95},
          thickness=0.5));
      connect(lineForceWithMass.flange_a, elastoGap.flange_a) annotation (Line(
            points={{24,60},{22,60},{22,10},{20,10}}, color={0,127,0}));
      connect(lineForceWithMass.flange_b, elastoGap.flange_b) annotation (Line(
            points={{36,60},{38,60},{38,10},{40,10}}, color={0,127,0}));
      annotation (Diagram(coordinateSystem(preserveAspectRatio=false, extent={{
                -100,-100},{100,100}}), graphics));
    end NewtonCradle;

    model WheelOnWheel
      Joints.RollingWheel rollingWheel(radius=1, revolute(phi(fixed=true), w(
              fixed=true, start=1)))
        annotation (Placement(transformation(extent={{-10,-30},{10,-10}})));
      inner Modelica.Mechanics.MultiBody.World world
        annotation (Placement(transformation(extent={{-100,-30},{-80,-10}})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox plane(
        length=20,
        color={175,175,175},
        specularCoefficient=0,
        width=0.1,
        height=0.5,
        r={0,0,0},
        r_shape={-10,-0.05,0},
        lengthDirection={1,0,0})
        annotation (Placement(transformation(extent={{-40,-30},{-20,-10}})));
      Modelica.Mechanics.MultiBody.Parts.BodyCylinder wheel(
        r={0,0,0},
        lengthDirection={0,0,1},
        length=0.1,
        diameter=2,
        color={95,95,95},
        specularCoefficient=0,
        body(cylinder(Extra=1)))
        annotation (Placement(transformation(extent={{8,10},{28,30}})));
      Modelica.Mechanics.MultiBody.Parts.FixedRotation fixedRotation(n={0,0,1},
          angle=-10)
        annotation (Placement(transformation(extent={{-70,-30},{-50,-10}})));
      Joints.RollingWheel rollingWheel1(         revolute(phi(fixed=true), w(
              fixed=true, start=1)), radius=1)
        annotation (Placement(transformation(extent={{60,30},{80,50}})));
      Modelica.Mechanics.MultiBody.Parts.BodyCylinder wheel1(
        r={0,0,0},
        lengthDirection={0,0,1},
        length=0.1,
        diameter=2,
        color={95,95,95},
        specularCoefficient=0)
        annotation (Placement(transformation(extent={{80,70},{100,90}})));
      Joints.RollingWheel rollingWheel2(         revolute(phi(fixed=true), w(
              fixed=true, start=1)), radius=-1)
        annotation (Placement(transformation(extent={{-10,-10},{10,10}},
            rotation=180,
            origin={30,40})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox plane1(
        color={175,175,175},
        specularCoefficient=0,
        width=0.1,
        height=0.5,
        r={0,1,0},
        length=1)
        annotation (Placement(transformation(extent={{38,-14},{58,6}})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox plane2(
        color={175,175,175},
        specularCoefficient=0,
        width=0.1,
        height=0.5,
        r={0,1,0},
        length=1)
        annotation (Placement(transformation(extent={{94,-14},{114,6}})));
      Modelica.Mechanics.MultiBody.Parts.BodyBox plane3(
        color={175,175,175},
        specularCoefficient=0,
        width=0.1,
        height=0.5,
        r={0,1,0},
        length=1)
        annotation (Placement(transformation(extent={{38,54},{58,74}})));
    equation
      connect(plane.frame_b, rollingWheel.frame_a) annotation (Line(
          points={{-20,-20},{-20,-20},{-10,-20}},
          color={95,95,95},
          thickness=0.5));
      connect(rollingWheel.frame_b, wheel.frame_a) annotation (Line(
          points={{0,-14},{0,4},{0,20},{8,20}},
          color={95,95,95},
          thickness=0.5));
      connect(world.frame_b, fixedRotation.frame_a) annotation (Line(
          points={{-80,-20},{-70,-20}},
          color={95,95,95},
          thickness=0.5));
      connect(plane.frame_a, fixedRotation.frame_b) annotation (Line(
          points={{-40,-20},{-50,-20}},
          color={95,95,95},
          thickness=0.5));
      connect(rollingWheel1.frame_b, wheel1.frame_a) annotation (Line(
          points={{70,46},{70,64},{70,80},{80,80}},
          color={95,95,95},
          thickness=0.5));
      connect(rollingWheel2.frame_b, wheel.frame_b) annotation (Line(
          points={{30,34},{30,34},{30,20},{28,20}},
          color={95,95,95},
          thickness=0.5));
      connect(rollingWheel2.frame_b, plane1.frame_a) annotation (Line(
          points={{30,34},{36,34},{36,-4},{38,-4}},
          color={95,95,95},
          thickness=0.5));
      connect(plane2.frame_b, rollingWheel1.frame_b) annotation (Line(
          points={{114,-4},{118,-4},{120,-4},{120,46},{70,46}},
          color={95,95,95},
          thickness=0.5));
      connect(rollingWheel2.frame_a, plane3.frame_a) annotation (Line(
          points={{40,40},{40,40},{40,64},{38,64}},
          color={95,95,95},
          thickness=0.5));
      connect(rollingWheel1.frame_a, plane3.frame_b) annotation (Line(
          points={{60,40},{60,40},{60,64},{58,64}},
          color={95,95,95},
          thickness=0.5));
      annotation (Diagram(coordinateSystem(preserveAspectRatio=false, extent={{
                -100,-100},{100,100}}),
                          graphics));
    end WheelOnWheel;
  end Examples;

  package Joints
    model RollingWheel

      parameter Modelica.SIunits.Length radius;
      Modelica.Mechanics.MultiBody.Joints.Prismatic prismatic(useAxisFlange=true)
        annotation (Placement(transformation(extent={{-80,-10},{-60,10}})));
      Modelica.Mechanics.MultiBody.Joints.Revolute revolute(useAxisFlange=true)
        annotation (Placement(transformation(extent={{40,20},{60,40}})));
      Modelica.Mechanics.MultiBody.Parts.FixedTranslation fixedTranslation(r={0,
            radius,0})
        annotation (Placement(transformation(extent={{-10,-10},{10,10}},
            rotation=90,
            origin={0,10})));
      Modelica.Mechanics.Rotational.Components.IdealGearR2T idealGearR2T(ratio=-1/
            radius)
        annotation (Placement(transformation(extent={{-34,30},{-54,50}})));
      Modelica.Mechanics.MultiBody.Interfaces.Frame_a
                         frame_a
        "Coordinate system fixed to the component with one cut-force and cut-torque"
                                 annotation (Placement(transformation(extent={{-116,
                -16},{-84,16}},      rotation=0)));
      Modelica.Mechanics.MultiBody.Interfaces.Frame_b
                         frame_b
        "Coordinate system fixed to the component with one cut-force and cut-torque"
                                 annotation (Placement(transformation(extent={{-16,44},
                {16,76}},       rotation=0), iconTransformation(extent={{-16,44},
                {16,76}})));
    equation

      connect(frame_a, prismatic.frame_a) annotation (Line(
          points={{-100,0},{-80,0}},
          color={95,95,95},
          thickness=0.5));
      connect(frame_b, revolute.frame_b) annotation (Line(
          points={{0,60},{60,60},{60,30}},
          color={95,95,95},
          thickness=0.5));
      connect(prismatic.frame_b, fixedTranslation.frame_a) annotation (Line(
          points={{-60,0},{-4.44089e-016,0}},
          color={95,95,95},
          thickness=0.5));
      connect(revolute.frame_a, fixedTranslation.frame_b) annotation (Line(
          points={{40,30},{0,30},{0,20},{6.66134e-016,20}},
          color={95,95,95},
          thickness=0.5));
      connect(idealGearR2T.flangeR, revolute.axis)
        annotation (Line(points={{-34,40},{-34,40},{50,40}},       color={0,0,0}));
      connect(idealGearR2T.flangeT, prismatic.axis) annotation (Line(points={{-54,40},
              {-54,40},{-62,40},{-62,6}}, color={0,127,0}));
      annotation (Icon(coordinateSystem(preserveAspectRatio=false, extent={{-100,
                -100},{100,100}}),
                             graphics={Rectangle(extent={{-100,-20},{100,20}},
              lineColor={0,0,0},
              fillColor={215,215,215},
              fillPattern=FillPattern.Solid),
                                      Ellipse(extent={{-40,100},{40,20}},
              pattern=LinePattern.None,
              lineColor={0,0,0},
              fillColor={135,135,135},
              fillPattern=FillPattern.Solid)}),
                               Diagram(coordinateSystem(preserveAspectRatio=false,
              extent={{-100,-100},{100,100}}),
                                       graphics));
    end RollingWheel;

    model StiffJoint
      extends Modelica.Mechanics.MultiBody.Interfaces.PartialForce;
      parameter Real reciprocalStiffness=1E-6 annotation(Evaluate=true);
    equation
      reciprocalStiffness*frame_b.f = r_rel_b;
      frame_b.t = zeros(3);
      annotation (Icon(coordinateSystem(preserveAspectRatio=false, extent={{-100,-100},
                {100,100}}), graphics={Line(
              points={{-100,0},{100,0}},
              color={0,0,255},
              pattern=LinePattern.Dot,
              thickness=1)}));
    end StiffJoint;

    model Bushing
      "Forces and torques acting in/about three-directions of frame_a depending on relative position and orientation to frame_b, no states"
      extends Modelica.Mechanics.MultiBody.Interfaces.PartialTwoFrames;

      import Modelica.Mechanics.MultiBody.Frames;
      import Modelica.Mechanics.MultiBody.Types;

      parameter Modelica.SIunits.TranslationalSpringConstant c_x(final min=0)=1e7
        "Spring constant in x-direction of frame a";
      parameter Modelica.SIunits.TranslationalSpringConstant c_y(final min=0)=1e7
        "Spring constant in y-direction of frame a";
      parameter Modelica.SIunits.TranslationalSpringConstant c_z(final min=0)=1e7
        "Spring constant in z-direction of frame a";
      parameter Modelica.SIunits.TranslationalDampingConstant d_x(final min=0)=
        1e4 "Damping constant in x-direction of frame a";
      parameter Modelica.SIunits.TranslationalDampingConstant d_y(final min=0)=
        1e4 "Damping constant in y-direction of frame a";
      parameter Modelica.SIunits.TranslationalDampingConstant d_z(final min=0)=
        1e4 "Damping constant in z-direction of frame a";

      parameter Modelica.SIunits.RotationalSpringConstant c_al(final min=0)=1e5
        "Rotational spring constant around x-direction of frame a";
      parameter Modelica.SIunits.RotationalSpringConstant c_be(final min=0)=1e5
        "Rotational spring constant around y-direction of frame a";
      parameter Modelica.SIunits.RotationalSpringConstant c_ga(final min=0)=1e5
        "Rotational spring constant around z-direction of frame a";
      parameter Modelica.SIunits.RotationalDampingConstant d_al(final min=0)=1e2
        "Rotational damping constant around x-direction of frame a";
      parameter Modelica.SIunits.RotationalDampingConstant d_be(final min=0)=1e2
        "Rotational damping constant around y-direction of frame a";
      parameter Modelica.SIunits.RotationalDampingConstant d_ga(final min=0)=1e2
        "Rotational damping constant around z-direction of frame a";

      parameter Boolean animation=true
        "True, if animation shall be enabled (show sphere)"
        annotation (Dialog(group="Animation"));
      parameter Boolean outerAtA=true
        "True, if outer cylinder should be connected to frame_a and inner one to frame_b"
        annotation (Dialog(group="Animation", enable=animation));
      parameter Types.Axis lengthDirection={0,0,1}
        "Direction of cylinders representing bushing (resolved in frame_a)"
        annotation (Dialog(group="Animation", enable=animation));
      parameter Modelica.SIunits.Length length=world.defaultJointLength/3
        "Length of inner cylinder (length of outer cylinder is smaller)"
        annotation (Dialog(group="Animation", enable=animation));
      parameter Modelica.SIunits.Diameter diameter=world.defaultJointLength/2
        "Diameter of outer cylinder"
        annotation (Dialog(group="Animation", enable=animation));
      input Types.Color color_a=Types.Defaults.JointColor
        "Color of outer cylinder (connected to frame_a)"
        annotation (Dialog(group="Animation", enable=animation));
      input Types.Color color_b=Types.Defaults.BodyColor
        "Color of inner cylinder (connected to frame_b)"
        annotation (Dialog(group="Animation", enable=animation));
      input Types.SpecularCoefficient specularCoefficient=world.defaultSpecularCoefficient
        "Reflection of ambient light (= 0: light is completely absorbed)"
        annotation (Dialog(group="Animation", enable=animation));
    protected
      final parameter Types.Axis e_x=Modelica.Math.Vectors.normalize(
          lengthDirection);
      final parameter Types.Axis e_y=cross(e_x, {0,1,0});
      final parameter Modelica.SIunits.Length length_a=if outerAtA then 0.7*
          length else length;
      final parameter Modelica.SIunits.Length length_b=if outerAtA then length
           else 0.7*length;
      final parameter Modelica.SIunits.Diameter diameter_a=if outerAtA then
          diameter else 0.65*diameter;
      final parameter Modelica.SIunits.Diameter diameter_b=if outerAtA then 0.65*
          diameter else diameter;
    public
      Modelica.SIunits.Position r_rel_a[3]
        "Position vector from origin of frame_a to origin of frame_b, resolved in frame_a";
      Modelica.SIunits.Velocity v_rel_a[3]
        "Velocity of frame_b w.r.t. frame_a, resolve din frame_a";
      //( stateSelect=StateSelect.never)

      Frames.Orientation R_rel
        "Dummy or relative orientation object from frame_a to frame_b";
      Modelica.SIunits.Angle phi_rel[3];
      Modelica.SIunits.AngularVelocity w_rel[3];

    protected
      Modelica.Mechanics.MultiBody.Visualizers.Advanced.Shape cylinder_a(
        shapeType="cylinder",
        r_shape=-e_x*length_a/2,
        r=frame_a.r_0,
        R=frame_a.R,
        lengthDirection=e_x,
        widthDirection=e_y,
        length=length_a,
        width=diameter_a,
        height=diameter_a,
        color=color_a,
        specularCoefficient=specularCoefficient) if world.enableAnimation and
        animation;
      Modelica.Mechanics.MultiBody.Visualizers.Advanced.Shape cylinder_b(
        shapeType="cylinder",
        r_shape=-e_x*length_b/2,
        r=frame_b.r_0,
        R=frame_b.R,
        lengthDirection=e_x,
        widthDirection=e_y,
        length=length_b,
        width=diameter_b,
        height=diameter_b,
        color=color_b,
        specularCoefficient=specularCoefficient) if world.enableAnimation and
        animation;

    equation
      // Determine relative position vector resolved in frame_a
      r_rel_a = Frames.resolve2(frame_a.R, frame_b.r_0 - frame_a.r_0);
      v_rel_a = Frames.resolve2(frame_a.R, der(frame_b.r_0) - der(frame_a.r_0));
      R_rel = Frames.relativeRotation(frame_a.R, frame_b.R);
      phi_rel = Frames.smallRotation(R_rel, false);
      //Frames.axesRotationsAngles(R_rel,{2,3,1},0);//
      w_rel = Frames.angularVelocity1(R_rel);

      // Forces
      frame_a.f[1] = -1*c_x*r_rel_a[1] - d_x*v_rel_a[1];
      frame_a.f[2] = -1*c_y*r_rel_a[2] - d_y*v_rel_a[2];
      frame_a.f[3] = -1*c_z*r_rel_a[3] - d_z*v_rel_a[3];
      zeros(3) = frame_a.f + Frames.resolve1(R_rel, frame_b.f);
      // Torques
      frame_a.t[1] = -c_al*phi_rel[1] - d_al*w_rel[1];
      frame_a.t[2] = -c_be*phi_rel[2] - d_be*w_rel[2];
      frame_a.t[3] = -c_ga*phi_rel[3] - d_ga*w_rel[3];
      zeros(3) = frame_a.t + Frames.resolve1(R_rel, frame_b.t) - cross(r_rel_a,
        frame_a.f);

      annotation (
        defaultComponentName="bushing",
        Icon(coordinateSystem(
            preserveAspectRatio=true,
            extent={{-100,-100},{100,100}},
            grid={2,2}), graphics={Rectangle(
              extent={{-98,80},{98,-44}},
              fillColor={255,255,255},
              fillPattern=FillPattern.Solid,
              pattern=LinePattern.None,
              lineColor={0,0,0}),Ellipse(
              extent={{-50,0},{50,-40}},
              lineColor={0,0,0},
              fillColor={215,215,215},
              fillPattern=FillPattern.Sphere),Text(
              extent={{-150,120},{150,80}},
              lineColor={0,0,255},
              textString="%name"),Text(
              extent={{-100,-40},{100,-70}},
              lineColor={0,0,0},
              textString="6 directions"),Text(
              extent={{-100,-70},{100,-100}},
              lineColor={0,0,0},
              textString="Linear"),Rectangle(
              extent={{-50,30},{50,-20}},
              lineColor={0,0,0},
              fillColor={215,215,215},
              fillPattern=FillPattern.VerticalCylinder),Ellipse(
              extent={{-50,50},{50,10}},
              lineColor={0,0,0},
              fillColor={215,215,215},
              fillPattern=FillPattern.Solid),Ellipse(
              extent={{-31,16},{31,-16}},
              lineColor={0,0,0},
              fillColor={135,135,135},
              fillPattern=FillPattern.Sphere,
              origin={3,32},
              rotation=-10),Rectangle(
              extent={{-32.8012,9.68163},{32.8012,-9.68163}},
              lineColor={0,0,0},
              fillColor={135,135,135},
              fillPattern=FillPattern.VerticalCylinder,
              origin={5.1777,42.1587},
              rotation=-14),Ellipse(
              extent={{-31,16},{31,-16}},
              lineColor={0,0,0},
              fillColor={135,135,135},
              fillPattern=FillPattern.Sphere,
              origin={7,50},
              rotation=-14),Line(
              points={{-100,0},{-48,0}},
              color={0,0,0},
              smooth=Smooth.None),Line(
              points={{30,52},{70,52},{70,0},{100,0}},
              color={0,0,0},
              smooth=Smooth.None)}),
        Diagram(coordinateSystem(
            preserveAspectRatio=true,
            extent={{-100,-100},{100,100}},
            grid={2,2}), graphics),
        Documentation(info="<html>
<p>This model defines forces and torques acting between connecting frames. The forces and torques depend on the relative position and orientation angles from frame_a to frame_b, and their derivatives, respectively. Generally, this element can be used as a bushing between two bodies instead of using idealized joint of fixed connection. This element has <b>no states</b>.</p>
<p>Remember, this element should only be used for <b>small relative angles</b> between frame_a and frame_b, i.e for angles under 5 degrees.</p>
</html>",   revisions="<html>
<p>
Developed by DLR-SR
</p>
</html>"));
    end Bushing;
  end Joints;
  annotation (uses(Modelica(version="3.2.1")));
  package Parts
    record FrameProperties
      parameter Modelica.SIunits.Position r[3]={0,0,0}
        "Displacement from body frame to frame_a";
      parameter Modelica.Mechanics.MultiBody.Types.Axis n_x={1,0,0}
        " Vector along x-axis of frame_b resolved in frame_a"
        annotation (Evaluate=true);
      parameter Modelica.Mechanics.MultiBody.Types.Axis n_y={0,1,0}
        " Vector along y-axis of frame_b resolved in frame_a"
        annotation (Evaluate=true);
    end FrameProperties;

    model Body
    end Body;
  end Parts;
end VisualMultiBody;
