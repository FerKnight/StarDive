
export const categories = [
  {key:'personajes',label:'Personajes',dataKey:'personajes'},
  {key:'artefactos',label:'Artefactos',dataKey:'artefactos'},
  {key:'equipamientos',label:'Equipamientos',dataKey:'conjuntos'},
  {key:'monsterlings',label:'Monsterlings',dataKey:'monsterlings'}
];

export const searchableCategories = [
  {key:'personajes',label:'Personajes'},
  {key:'artefactos',label:'Artefactos',dataKey:'artefactos'},
  {key:'equipamientos',label:'Equipamientos',dataKey:'conjuntos'},
  {key:'monsterlings',label:'Monsterlings',dataKey:'monsterlings'},
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

  equipamientos: [
    {field:'elemento',label:'Elemento'},
    {field:'tipo_efecto',label:'Tipo de efecto'}
  ],

  monsterlings: [
    {field:'tipo',label:'Tipo',aliases:['tipo','type']},
    {field:'region',label:'Región',aliases:['region','región']}
  ]
};
