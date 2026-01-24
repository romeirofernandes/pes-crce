import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy } from 'lucide-react'

const computeLeagueTable = (matches, competitors) => {
    const stats = {}
    
    // Initialize stats
    competitors.forEach(c => {
        stats[c.id] = {
            id: c.id,
            name: c.name, // or resolve later
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            gf: 0,
            ga: 0,
            gd: 0,
            points: 0
        }
    })

    // Process matches
    matches.forEach(m => {
        if (!m.completed || !stats[m.home] || !stats[m.away]) return

        const home = stats[m.home]
        const away = stats[m.away]

        home.played++
        away.played++

        home.gf += m.homeScore
        home.ga += m.awayScore
        home.gd = home.gf - home.ga

        away.gf += m.awayScore
        away.ga += m.homeScore
        away.gd = away.gf - away.ga

        if (m.homeScore > m.awayScore) {
            home.won++
            home.points += 3
            away.lost++
        } else if (m.awayScore > m.homeScore) {
            away.won++
            away.points += 3
            home.lost++
        } else {
            home.drawn++
            home.points += 1
            away.drawn++
            away.points += 1
        }
    })

    return Object.values(stats).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.gd !== a.gd) return b.gd - a.gd
        if (b.gf !== a.gf) return b.gf - a.gf
        return a.name.localeCompare(b.name)
    })
}

const LeagueTable = ({ matches, competitors, getTeamName }) => {
    // Resolve names for competitors first
    const competitorsWithNames = competitors.map(c => ({
        ...c,
        name: getTeamName(c.id)
    }))

    const table = computeLeagueTable(matches, competitorsWithNames)
    const winner = table.length > 0 && table[0].played > 0 ? table[0] : null
    
    // Check if tournament is essentially "finished" (all matches played)
    // simplistic check: if all matches are completed
    const isFinished = matches.length > 0 && matches.every(m => m.completed)

    return (
        <div className="space-y-6">
            {isFinished && winner && (
                 <Card className="bg-linear-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-500/50">
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                       <Trophy className="w-6 h-6" />
                       League Winner
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     <p className="text-2xl font-bold">{winner.name}</p>
                     <p className="text-sm text-muted-foreground mt-1">
                        {winner.points} points · {winner.won} wins · {winner.gd > 0 ? '+' : ''}{winner.gd} GD
                     </p>
                   </CardContent>
                 </Card>
            )}

            <div className="rounded-md border border-accent bg-card overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-accent bg-muted/50">
                            <th className="h-10 px-4 text-left font-medium w-12 text-muted-foreground">#</th>
                            <th className="h-10 px-4 text-left font-medium text-muted-foreground">Team</th>
                            <th className="h-10 px-4 text-center font-medium w-12 text-muted-foreground">P</th>
                            <th className="h-10 px-4 text-center font-medium w-12 text-muted-foreground">W</th>
                            <th className="h-10 px-4 text-center font-medium w-12 text-muted-foreground">D</th>
                            <th className="h-10 px-4 text-center font-medium w-12 text-muted-foreground">L</th>
                            <th className="h-10 px-4 text-center font-medium w-12 text-muted-foreground">GF</th>
                            <th className="h-10 px-4 text-center font-medium w-12 text-muted-foreground">GA</th>
                            <th className="h-10 px-4 text-center font-medium w-12 text-muted-foreground">GD</th>
                            <th className="h-10 px-4 text-center font-medium w-12 text-foreground">Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {table.map((row, i) => (
                            <tr key={row.id} className="border-b border-accent last:border-0 hover:bg-muted/50 transition-colors">
                                <td className="p-4 text-muted-foreground">{i + 1}</td>
                                <td className="p-4 font-medium text-foreground">{row.name}</td>
                                <td className="p-4 text-center text-foreground">{row.played}</td>
                                <td className="p-4 text-center text-green-600 dark:text-green-400">{row.won}</td>
                                <td className="p-4 text-center text-muted-foreground">{row.drawn}</td>
                                <td className="p-4 text-center text-red-600 dark:text-red-400">{row.lost}</td>
                                <td className="p-4 text-center text-foreground">{row.gf}</td>
                                <td className="p-4 text-center text-foreground">{row.ga}</td>
                                <td className="p-4 text-center text-foreground">{row.gd > 0 ? '+' : ''}{row.gd}</td>
                                <td className="p-4 text-center font-bold text-foreground">{row.points}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default LeagueTable
