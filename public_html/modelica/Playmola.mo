within ;
package Playmola
  function GetComponents
    input String packageName;
    String localClasses[:] =  ModelManagement.Structure.AST.ClassesInPackage(packageName);
    String restricted = "";
    Integer count[:] =  size(localClasses);
    Integer positionInBuffer = 1;
    output Playmola.Class classes[20];
  algorithm
    for i in 1:count[1] loop
      restricted := ModelManagement.Structure.AST.ClassRestricted(packageName + "." + localClasses[i]);
      if not restricted == "package" then
        classes[positionInBuffer].className := localClasses[i];
        classes[positionInBuffer].fullPathName := packageName + "." + localClasses[i];
        classes[positionInBuffer].components := ModelManagement.Structure.AST.ComponentsInClassAttributes(packageName + "." + localClasses[i]);
        positionInBuffer := positionInBuffer + 1;
      end if;
    end for;
  end GetComponents;

  record Class
    String className;
    String fullPathName;
    ModelManagement.Structure.AST.ComponentAttributes components[:];
  end Class;

  model SimpleRevoluteJoint
    extends Modelica.Mechanics.MultiBody.Joints.Revolute(phi(start = StartAngle), n = AxisOfRotation);

    parameter Modelica.SIunits.Angle StartAngle = 0;
    parameter Modelica.Mechanics.MultiBody.Types.Axis AxisOfRotation = {0,0,1};
  end SimpleRevoluteJoint;

  model SimplePrismaticJoint
    extends Modelica.Mechanics.MultiBody.Joints.Prismatic(s(start = StartTranslation), n=AxisOfTranslation);

    parameter Modelica.SIunits.Position StartTranslation = 0;
    parameter Modelica.Mechanics.MultiBody.Types.Axis AxisOfTranslation = {1,0,0};

  end SimplePrismaticJoint;
  annotation (
    uses(Modelica(version="3.2.1"), ModelManagement(version="1.1.3")),
    version="1",
    conversion(noneFromVersion=""));
end Playmola;
