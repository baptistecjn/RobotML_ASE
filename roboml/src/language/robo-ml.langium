grammar RoboML

entry RobotMLProgram:
    functions+=FunctionDef*;

FunctionDef:
    'let' returnType=Datatype name=ID '(' (parameters+=Parameter (',' parameters+=Parameter)*)? ')' '{'
        body+=Statement*
    '}';

Parameter:
    type=Datatype name=ID;

Statement:
    VariableDecla | FunctionCall | Assignment | Loop | Condition | Movement | Rotation | SetSpeed | Return;

VariableDecla:
    'var' type=Datatype name=ID ('=' initialValue=Expression)?;

Assignment:
    variable=[Variable:ID] '=' value=Expression;

type Variable = Parameter | VariableDecla;

Loop:
    'loop' condition=Expression '{'
        body+=Statement*
    '}';

Condition:
    'if' condition=Expression '{'
        thenBranch+=Statement*
    '}' ('else' '{'
        elseBranch+=Statement*
    '}')?;

Movement:
    direction=MovementDirection distance=Expression 'in'? unit=DistanceUnit;

Rotation:
    direction=RotationDirection angle=Expression;

SetSpeed:
    'setSpeed' '(' speed=Expression 'in'? unit=DistanceUnit ')';

FunctionCall:
    function=[FunctionDef:ID] '(' (arguments+=Expression (',' arguments+=Expression)*)? ')';

Return:
    {infer Return} 'return' (expression=Expression)?;

// --- Expressions avec priorités d'opérateurs ---

Expression:
    OrExpression;

OrExpression infers Expression:
    AndExpression ({infer BinaryExpression.left=current} operator='||' right=AndExpression)*;

AndExpression infers Expression:
    EqualityExpression ({infer BinaryExpression.left=current} operator='&&' right=EqualityExpression)*;

EqualityExpression infers Expression:
    ComparisonExpression ({infer BinaryExpression.left=current} operator=('==' | '!=') right=ComparisonExpression)*;

ComparisonExpression infers Expression:
    AdditiveExpression ({infer BinaryExpression.left=current} operator=('<' | '<=' | '>' | '>=') right=AdditiveExpression)*;

AdditiveExpression infers Expression:
    MultiplicativeExpression ({infer BinaryExpression.left=current} operator=('+' | '-') right=MultiplicativeExpression)*;

MultiplicativeExpression infers Expression:
    PrimaryExpression ({infer BinaryExpression.left=current} operator=('*' | '/') right=PrimaryExpression)*;

PrimaryExpression infers Expression:
    '(' Expression ')' |
    UnaryExpression |
    FunctionCall |
    NumberConstant |
    BooleanConstant |
    DistanceSensor |
    TimeSensor |
    VariableRef;

UnaryExpression:
    operator=('!' | '-') operand=PrimaryExpression;

NumberConstant:
    value=NUMBER;

BooleanConstant:
    {infer BooleanConstant} (value?='true' | 'false');

VariableRef:
    variable=[Variable:ID];

DistanceSensor:
    {infer DistanceSensor} 'getDistance' '(' ')' ('in'? unit=DistanceUnit)?;

TimeSensor:
    {infer TimeSensor} 'getTimestamp' '(' ')';

// --- Types et Enums ---

Datatype returns string:
    'void' | 'number' | 'bool';

DistanceUnit returns string:
    'mm' | 'cm' | 'm';

MovementDirection returns string:
    'Forward' | 'Backward' | 'Left' | 'Right';

RotationDirection returns string:
    'Clock' | 'Anticlock';

// --- Terminaux ---

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal NUMBER returns number: /[0-9]+(\.[0-9]+)?/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;