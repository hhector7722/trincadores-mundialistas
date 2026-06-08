-- Color predominante de camiseta titular por equipo (MVP / lineup).

alter table public.teams
  add column primary_kit_hex text;

comment on column public.teams.primary_kit_hex is
  'Color predominante de la camiseta titular (#RRGGBB).';

alter table public.teams
  add constraint teams_primary_kit_hex_format_chk
  check (
    primary_kit_hex is null
    or primary_kit_hex ~ '^#[0-9A-Fa-f]{6}$'
  );

with kit_seed (slug, hex) as (
  values
    ('algeria', '#006233'),
    ('argentina', '#6CB4EE'),
    ('australia', '#FFCD00'),
    ('austria', '#ED2939'),
    ('belgium', '#E30613'),
    ('bosnia-and-herzegovina', '#002395'),
    ('brazil', '#FFE900'),
    ('canada', '#D80621'),
    ('cape-verde', '#003893'),
    ('colombia', '#FCD116'),
    ('croatia', '#C8102E'),
    ('curacao', '#002B7F'),
    ('czech-republic', '#D7141A'),
    ('dr-congo', '#007FFF'),
    ('ecuador', '#FFD100'),
    ('egypt', '#CE1126'),
    ('england', '#FFFFFF'),
    ('france', '#002395'),
    ('germany', '#FFFFFF'),
    ('ghana', '#FDB913'),
    ('haiti', '#00209F'),
    ('iran', '#239F40'),
    ('iraq', '#017B4B'),
    ('ivory-coast', '#F77F00'),
    ('japan', '#003087'),
    ('jordan', '#CE1126'),
    ('mexico', '#006847'),
    ('morocco', '#C1272D'),
    ('netherlands', '#FF6600'),
    ('new-zealand', '#FFFFFF'),
    ('norway', '#BA0C2F'),
    ('panama', '#DA121A'),
    ('paraguay', '#0038A8'),
    ('portugal', '#DA020E'),
    ('qatar', '#8A1538'),
    ('saudi-arabia', '#006C35'),
    ('scotland', '#003876'),
    ('senegal', '#00853F'),
    ('south-africa', '#FECC00'),
    ('south-korea', '#CD2E3A'),
    ('spain', '#C60B1E'),
    ('sweden', '#FECC00'),
    ('switzerland', '#DA291C'),
    ('tunisia', '#E70013'),
    ('turkey', '#E30A17'),
    ('usa', '#002868'),
    ('uruguay', '#5B9BD5'),
    ('uzbekistan', '#0099B5')
)
update public.teams t
set primary_kit_hex = k.hex
from kit_seed k
where t.external_key = k.slug;
