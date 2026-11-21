
export const categories = [
  {key:'personajes',label:'Personajes',dataKey:'personajes'},
  {key:'artefactos',label:'Artefactos',dataKey:'artefactos'},
  {key:'equipamientos',label:'Equipamientos',dataKey:'equipamientos'},
  {key:'monsterlings',label:'Monsterlings',dataKey:'monsterlings'},
  {key:'equipos',label:'Equipos',dataKey:'conjuntos'}
];

export const searchableCategories = [
  {key:'personajes',label:'Personajes'},
  {key:'artefactos',label:'Artefactos'},
  {key:'equipamientos',label:'Equipamientos'},
  {key:'monsterlings',label:'Monsterlings'},
  {key:'equipos',label:'Equipos',dataKey:'conjuntos'},
  {key:'regiones',label:'Regiones'}
];

export const filterDefinitions = {
  personajes: [
    {field:'grado',label:'Grado',aliases:['grado','rareza','rarity']},
    {field:'elemento',label:'Elemento',aliases:['elemento','element']},
    {field:'tipo',label:'Tipo',aliases:['tipo','type']},
    {field:'rango',label:'Rango',aliases:['rango','rank']}
  ],

  artefactos: [
    {field:'grado',label:'Grado',aliases:['grado','rareza','rarity']},
    {field:'rol',label:'Rol',aliases:['rol','role']},
    {field:'elemento',label:'Elemento'},
    {field:'efectos',label:'Efectos'}
  ],

  monsterlings: [
    {field:'tipo',label:'Tipo',aliases:['tipo','type']},
    {field:'region',label:'Región',aliases:['region','región']}
  ],

  equipos: [
    {field:'efecto_2_piezas',label:'Bonificación 2 piezas',aliases:['efecto_2_piezas']},
    {field:'efecto_4_piezas',label:'Bonificación 4 piezas',aliases:['efecto_4_piezas']}
  ]
};
