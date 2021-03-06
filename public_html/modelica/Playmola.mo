within ;
package Playmola
  function GetComponents
    input String packageName;
  protected
      String localClasses[:] =  ModelManagement.Structure.AST.ClassesInPackage(packageName);
      String restricted = "";
      Integer count =  size(localClasses,1);
      Integer numOfComponents;
      Integer positionInBuffer = 1;
    output Playmola.Class classes[20];
  algorithm
    for i in 1:count loop
      restricted := ModelManagement.Structure.AST.ClassRestricted(packageName + "." + localClasses[i]);
      if not restricted == "package" then
        classes[positionInBuffer].className := localClasses[i];
        classes[positionInBuffer].fullPathName := packageName + "." + localClasses[i];
        classes[positionInBuffer].components := ModelManagement.Structure.AST.ComponentsInClassAttributes(packageName + "." + localClasses[i]);
        numOfComponents := size(classes[positionInBuffer].components,1);
        for j in 1:numOfComponents loop
          classes[positionInBuffer].defaultValues[j] :=
           ModelManagement.Structure.AST.GetComponentText(classes[positionInBuffer].fullPathName, classes[positionInBuffer].components[j].name);
        end for;
        positionInBuffer := positionInBuffer + 1;
      end if;
    end for;
  end GetComponents;

  record Class
    String className;
    String fullPathName;
    ModelManagement.Structure.AST.ComponentAttributes components[:];
    String defaultValues[300];
  end Class;

  model SimpleRevoluteJoint
    extends Modelica.Mechanics.MultiBody.Joints.Revolute(phi(start = StartAngle), w(start = StartVelocity), n = AxisOfRotation, useAxisFlange=true);

    parameter Modelica.SIunits.Angle StartAngle = 0;
    parameter Modelica.SIunits.AngularVelocity StartVelocity = 0;
    parameter Modelica.Mechanics.MultiBody.Types.Axis AxisOfRotation = {0,0,1};
  end SimpleRevoluteJoint;

  model SimplePrismaticJoint
    extends Modelica.Mechanics.MultiBody.Joints.Prismatic(s(start = StartTranslation), n=AxisOfTranslation, useAxisFlange=true);

    parameter Modelica.SIunits.Position StartTranslation = 0;
    parameter Modelica.Mechanics.MultiBody.Types.Axis AxisOfTranslation = {1,0,0};

  end SimplePrismaticJoint;

  package UserComponents
  end UserComponents;

  model SimpleBodyBox
    extends Modelica.Mechanics.MultiBody.Parts.BodyBox(r = _r, r_shape = _r_shape, lengthDirection = _lengthDirection, length = _length, width = _width, height = _height, density = _density);

    parameter Modelica.SIunits.Position _r[3]={0,0,0};
    parameter Modelica.SIunits.Position _r_shape[3]={0,0,0};
    parameter Modelica.Mechanics.MultiBody.Types.Axis _lengthDirection={1,0,0};
    parameter Modelica.SIunits.Length _length=0.5;
    parameter Modelica.SIunits.Distance _width=0.5;
    parameter Modelica.SIunits.Distance _height=0.5;
    parameter Modelica.SIunits.Density _density=7700;
  end SimpleBodyBox;

  model SimpleBodyCylinder
    extends Modelica.Mechanics.MultiBody.Parts.BodyCylinder(r = _r, r_shape = _r_shape, lengthDirection = _lengthDirection, length = _length, diameter = _diameter);
      parameter Modelica.SIunits.Position _r[3]={0,0,0}
      "Vector from frame_a to frame_b, resolved in frame_a";
    parameter Modelica.SIunits.Position _r_shape[3]={0,0,0}
      "Vector from frame_a to cylinder origin, resolved in frame_a";
    parameter Modelica.Mechanics.MultiBody.Types.Axis _lengthDirection={1,0,0}
      "Vector in length direction of cylinder, resolved in frame_a"
      annotation (Evaluate=true);
    parameter Modelica.SIunits.Length _length=0.5 "Length of cylinder";
    parameter Modelica.SIunits.Distance _diameter=0.5 "Diameter of cylinder";
  equation

  end SimpleBodyCylinder;

  model SimpleInertia
     extends Modelica.Mechanics.Rotational.Components.Inertia(J=MomentOfIntertia,w(start=StartAngularVelocity));

      parameter Modelica.SIunits.Inertia MomentOfIntertia = 1;
      parameter Modelica.SIunits.AngularVelocity StartAngularVelocity = 0;

  end SimpleInertia;

  model SimpleWorld
    extends Modelica.Mechanics.MultiBody.World(g = Gravity, n = DirectionOfGravity);
    parameter Modelica.SIunits.Acceleration Gravity=9.81;
    parameter Modelica.Mechanics.MultiBody.Types.Axis DirectionOfGravity={0,-1,0};

  end SimpleWorld;

  model SimpleSpringDamper

    extends Modelica.Mechanics.Translational.Components.SpringDamper(c=SpringConstant,d=DampingConstant);

    parameter Modelica.SIunits.RotationalSpringConstant SpringConstant = 1.0e5;
    parameter Modelica.SIunits.RotationalDampingConstant DampingConstant = 0;
  end SimpleSpringDamper;

  model SimpleDamper
    extends Modelica.Mechanics.Rotational.Components.Damper(d=DampingConstant);
    parameter Modelica.SIunits.RotationalDampingConstant DampingConstant = 0;
  equation

  end SimpleDamper;

  model SimpleConstantSpeed
    extends Modelica.Mechanics.Rotational.Sources.ConstantSpeed( w_fixed = AngularVelocity);
    parameter Modelica.SIunits.AngularVelocity AngularVelocity = 0;
  equation

  end SimpleConstantSpeed;

  model SimpleBushing
    extends VisualMultiBody.Joints.Bushing;
  equation

  end SimpleBushing;

  model SimpleConstantTorque
    extends Modelica.Mechanics.Rotational.Sources.ConstantTorque(tau_constant = TauConstant);
    parameter Modelica.SIunits.Torque TauConstant = 0;
  equation

  end SimpleConstantTorque;

  model SimpleFixedRotation
    extends Modelica.Mechanics.MultiBody.Parts.FixedRotation(r = Translation, n=AxisOfRotation, angle = Angle);
    parameter Modelica.SIunits.Position Translation[3]={0,0,0};
    parameter Modelica.Mechanics.MultiBody.Types.Axis AxisOfRotation={1,0,0};
    parameter Modelica.SIunits.Conversions.NonSIunits.Angle_deg Angle = 0;
  end SimpleFixedRotation;
  annotation (
    uses(Modelica(version="3.2.1"), ModelManagement(version="1.1.3")),
    version="1",
    conversion(noneFromVersion=""));
end Playmola;
