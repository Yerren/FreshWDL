# Reorders a Bend file's top-level defs so every def sits below the defs it
# calls (Bend checks defs in file order). The header (comments and imports)
# stays first, then the types, then the defs; a comment block stays with the
# def or type it precedes.
#   perl tools/bend-order.pl < in.bend > out.bend
local $/;
my $src = <STDIN>;
my @chunks = split /(?=^(?:def |type |law |\@unsafe def ))/m, $src;
my $head = ($chunks[0] !~ /^(?:def |type |law |\@unsafe )/) ? shift @chunks : "";
my @items = @chunks;
for my $i (0 .. $#items - 1) {
  if ($items[$i] =~ s/((?:^#[^\n]*\n)+)\z//m) { $items[$i + 1] = $1 . $items[$i + 1]; }
}
if (@items && $head =~ s/((?:^#[^\n]*\n)+)\z//m) { $items[0] = $1 . $items[0]; }
my (@types, @defs);
for my $it (@items) {
  if ($it =~ /\A(?:#[^\n]*\n)*(?:type |law )/) { push @types, $it; next; }
  my ($n) = $it =~ /^(?:\@unsafe )?def ([A-Za-z0-9_.?]+)\(/m;
  push @defs, [$n, $it];
}
s/\n*\z/\n\n/ for @types;
$_->[1] =~ s/\n*\z/\n\n/ for @defs;
my %body = map { $_->[0] => $_->[1] } @defs;
my (@order, %done, %seen);
sub visit {
  my $n = shift;
  return if $done{$n} || $seen{$n};
  $seen{$n} = 1;
  (my $code = $body{$n}) =~ s/^\s*#[^\n]*\n//mg;
  for my $m (keys %body) {
    next if $m eq $n;
    visit($m) if $code =~ /(?<![A-Za-z0-9_.])\Q$m\E\(/;
  }
  $done{$n} = 1;
  push @order, $n;
}
visit($_->[0]) for @defs;
my $out = join "", $head, @types, map { $body{$_} } @order;
$out =~ s/\n*\z/\n/;
print $out;
