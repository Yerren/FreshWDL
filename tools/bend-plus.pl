# Marks every plain parameter of every def reusable (+name: T). Bend lets a
# Data value be used many times only when it is marked so; the app's state
# is all Data, so marking every parameter costs a reference count and saves
# hand-placing each +.   perl tools/bend-plus.pl < in.bend > out.bend
local $/;
my $src = <STDIN>;
$src =~ s{^((?:\@unsafe )?def [A-Za-z0-9_.?]+\()(.*?)(\)\s*(?:->[^\n]*)?:\n)}{
  my ($a, $ps, $b) = ($1, $2, $3);
  # split on commas at bracket depth 0
  my @p; my $d = 0; my $cur = "";
  for my $ch (split //, $ps) {
    $d++ if $ch =~ /[<({\[]/; $d-- if $ch =~ /[>)}\]]/;
    if ($ch eq "," && $d == 0) { push @p, $cur; $cur = ""; } else { $cur .= $ch; }
  }
  push @p, $cur if $cur =~ /\S/;
  for (@p) { s/^(\s*)([a-z_][A-Za-z0-9_]*\s*:)/$1+$2/ unless /^\s*[-+~&]/ || /^\s*[a-z]\s*$/; }
  $a . join(",", @p) . $b
}gmse;
print $src;
